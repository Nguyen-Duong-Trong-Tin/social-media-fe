import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import "leaflet/dist/leaflet.css";
import "./FriendAround.css";
import { getCookie } from "@/helpers/cookies";
import { userFindUsersWithLocation, userUpdateLocation } from "@/services/user";
import type { IUser } from "@/interfaces/user.interface";
import { socket } from "@/services/socket";
import SocketEvent from "@/enums/socketEvent.enum";

const DEFAULT_CENTER: [number, number] = [10.762622, 106.660172];
const ROUTE_SERVICE_URL = "https://router.project-osrm.org/route/v1/driving/";

function FriendAround() {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const otherUsersLayerRef = useRef<L.MarkerClusterGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [currentCoords, setCurrentCoords] = useState<[number, number] | null>(
    null,
  );
  const [currentAddress, setCurrentAddress] = useState("");
  const [routeInfo, setRouteInfo] = useState("");
  const [visibility, setVisibility] = useState<"friends" | "everyone">(
    "friends",
  );
  const [locationStatus, setLocationStatus] = useState(
    "Finding your location...",
  );

  const accessToken = getCookie("accessToken");
  const userId = getCookie("userId");

  const formatLastSeen = useCallback((value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    if (diffMs < 60_000) return "just now";

    const diffMinutes = Math.floor(diffMs / 60_000);
    if (diffMinutes < 60) {
      return `${diffMinutes} min ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  }, []);

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} h ${remainingMinutes} min`;
  };

  const reverseGeocode = useCallback(async (coords: [number, number]) => {
    const [lat, lng] = coords;
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const response = await fetch(url);
    if (!response.ok) return "";
    const data = await response.json();
    return typeof data?.display_name === "string" ? data.display_name : "";
  }, []);

  const drawRoute = useCallback(
    async (from: [number, number], to: [number, number], toAddress: string) => {
      if (!mapRef.current) return;

      setLocationStatus("Finding the shortest route...");
      setRouteInfo("");

      const fromParam = `${from[1]},${from[0]}`;
      const toParam = `${to[1]},${to[0]}`;
      const url = `${ROUTE_SERVICE_URL}${fromParam};${toParam}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Route request failed");
      }

      const data = await response.json();
      const route = data?.routes?.[0];
      if (!route) {
        throw new Error("Route not found");
      }

      const coordinates = route.geometry.coordinates.map(
        (point: [number, number]) => [point[1], point[0]] as [number, number],
      );

      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
      }

      routeLayerRef.current = L.polyline(coordinates, {
        color: "#0f172a",
        weight: 5,
        opacity: 0.85,
      }).addTo(mapRef.current);

      mapRef.current.fitBounds(routeLayerRef.current.getBounds(), {
        padding: [40, 40],
      });

      const distanceText = formatDistance(route.distance);
      const durationText = formatDuration(route.duration);
      const destinationLabel = toAddress ? ` • To: ${toAddress}` : "";
      setRouteInfo(
        `Route: ${distanceText} • ${durationText}${destinationLabel}`,
      );
      setLocationStatus("Your location is shown on the map.");
    },
    [],
  );

  const updateCurrentAddress = useCallback(
    async (coords: [number, number]) => {
      try {
        const address = await reverseGeocode(coords);
        if (address) {
          setCurrentAddress(address);
        }
      } catch {
        setCurrentAddress("");
      }
    },
    [reverseGeocode],
  );

  const renderUsers = useCallback(
    (users: IUser[]) => {
      if (!mapRef.current) return;

      if (!otherUsersLayerRef.current) {
        otherUsersLayerRef.current = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 50,
        }).addTo(mapRef.current);
      } else {
        otherUsersLayerRef.current.clearLayers();
      }

      users.forEach((user) => {
        if (!user.lastLocation) return;
        const { lat: userLat, lng: userLng, updatedAt } = user.lastLocation;
        const lastSeen = formatLastSeen(updatedAt);
        const updatedAtMs = updatedAt ? new Date(updatedAt).getTime() : 0;
        const diffMs = updatedAtMs ? Date.now() - updatedAtMs : Infinity;
        const isOnline = diffMs <= 90_000;
        const statusText = isOnline ? "Online" : lastSeen || "Offline";
        const statusClass = isOnline ? "is-online" : "is-offline";
        const userIcon = L.divIcon({
          className: "friend-around-avatar-icon",
          html: `
            <div class="friend-around-avatar-marker ${statusClass}">
              <img class="friend-around-avatar-image" src="${user.avatar}" alt="${user.fullName}" />
              <span class="friend-around-avatar-name">${user.fullName}</span>
              <span class="friend-around-avatar-status">${statusText}</span>
            </div>
          `,
          iconSize: [62, 72],
          iconAnchor: [31, 60],
          popupAnchor: [0, -54],
        });
        const marker = L.marker([userLat, userLng], { icon: userIcon });
        const profilePath = user.slug ? `/profile/${user.slug}` : "";
        const profileLink = profilePath
          ? `<a href="${profilePath}" class="friend-around-popup-link">View profile</a>`
          : "";
        const popup = `
          <div>
            <strong>${user.fullName}</strong>
            <div>${statusText}</div>
            ${profileLink}
          </div>
        `;
        marker.bindPopup(popup);
        marker.on("click", () => {
          if (!currentCoords) return;
          reverseGeocode([userLat, userLng])
            .then((address) =>
              drawRoute(currentCoords, [userLat, userLng], address),
            )
            .catch(() => {
              setLocationStatus("Unable to find route.");
            });
        });
        marker.addTo(otherUsersLayerRef.current as L.MarkerClusterGroup);
      });
    },
    [currentCoords, drawRoute, formatLastSeen, reverseGeocode],
  );

  const fetchUsersWithLocation = useCallback(async () => {
    if (!accessToken || !userId) return;

    const response = await userFindUsersWithLocation({
      accessToken,
      viewerId: userId,
    });
    const users: IUser[] = response?.data?.data || [];
    renderUsers(users);
  }, [accessToken, renderUsers, userId]);

  const syncLocationAndUsers = useCallback(
    async (
      coords: [number, number],
      currentVisibility: "friends" | "everyone",
    ) => {
      if (!accessToken || !userId) {
        setLocationStatus("Please sign in to use this feature.");
        return;
      }

      if (!mapRef.current) return;

      const [lat, lng] = coords;

      setLocationStatus("Saving your location...");
      await userUpdateLocation({
        accessToken,
        id: userId,
        lat,
        lng,
        visibility: currentVisibility,
      });

      socket.emit(SocketEvent.CLIENT_UPDATE_LOCATION, { userId });

      await fetchUsersWithLocation();

      setLocationStatus("Your location is shown on the map.");
    },
    [accessToken, fetchUsersWithLocation, userId],
  );

  const centerOnMe = useCallback(() => {
    if (!currentCoords || !mapRef.current) return;
    mapRef.current.setView(currentCoords, 15, { animate: true });
  }, [currentCoords]);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map("friend-around-map", {
      center: DEFAULT_CENTER,
      zoom: 12,
      scrollWheelZoom: true,
      keyboard: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;

    if (!navigator.geolocation) {
      setLocationStatus("Location not supported by this browser.");
      return () => {
        map.remove();
        mapRef.current = null;
      };
    }

    if (!accessToken || !userId) {
      setLocationStatus("Please sign in to use this feature.");
      return () => {
        map.remove();
        mapRef.current = null;
      };
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords: [number, number] = [latitude, longitude];

        map.setView(coords, 14);
        if (markerRef.current) {
          markerRef.current.setLatLng(coords);
        } else {
          markerRef.current = L.marker(coords).addTo(map);
        }
        setCurrentCoords(coords);
        updateCurrentAddress(coords);

        try {
          await syncLocationAndUsers(coords, visibility);
        } catch {
          setLocationStatus("Unable to load friends around you.");
        }
      },
      () => {
        setLocationStatus("Location permission denied.");
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
      },
    );

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (otherUsersLayerRef.current) {
        otherUsersLayerRef.current.clearLayers();
        otherUsersLayerRef.current = null;
      }
      if (routeLayerRef.current) {
        routeLayerRef.current.remove();
        routeLayerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!currentCoords) return;
    syncLocationAndUsers(currentCoords, visibility).catch(() => {
      setLocationStatus("Unable to load friends around you.");
    });
  }, [currentCoords, visibility, syncLocationAndUsers]);

  useEffect(() => {
    if (!accessToken || !userId) return;
    if (!navigator.geolocation) return;

    const intervalId = window.setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const coords: [number, number] = [latitude, longitude];

          if (markerRef.current) {
            markerRef.current.setLatLng(coords);
          }

          updateCurrentAddress(coords);

          try {
            await syncLocationAndUsers(coords, visibility);
          } catch {
            setLocationStatus("Unable to refresh location.");
          }
        },
        () => {
          setLocationStatus("Unable to refresh location.");
        },
        {
          enableHighAccuracy: true,
          timeout: 8000,
        },
      );
    }, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [accessToken, syncLocationAndUsers, userId, visibility]);

  useEffect(() => {
    if (!accessToken || !userId) return;

    const handler = () => {
      fetchUsersWithLocation().catch(() => {
        setLocationStatus("Unable to load friends around you.");
      });
    };

    socket.on(SocketEvent.SERVER_LOCATION_UPDATED, handler);
    return () => {
      socket.off(SocketEvent.SERVER_LOCATION_UPDATED, handler);
    };
  }, [accessToken, fetchUsersWithLocation, userId]);

  return (
    <section className="friend-around">
      <div className="friend-around-header">
        <div>
          <h3>Friends Around</h3>
          <p className="friend-around-status">{locationStatus}</p>
          <p className="friend-around-status">
            {currentAddress ? `You are at ${currentAddress}` : ""}
          </p>
          <p className="friend-around-status">{routeInfo}</p>
        </div>
        <div
          className="friend-around-visibility"
          role="group"
          aria-label="Visibility"
        >
          <span className="friend-around-label">Visibility</span>
          <div className="friend-around-toggle">
            <button
              type="button"
              className={
                visibility === "friends"
                  ? "friend-around-toggle-btn is-active"
                  : "friend-around-toggle-btn"
              }
              onClick={() => setVisibility("friends")}
            >
              Friends
            </button>
            <button
              type="button"
              className={
                visibility === "everyone"
                  ? "friend-around-toggle-btn is-active"
                  : "friend-around-toggle-btn"
              }
              onClick={() => setVisibility("everyone")}
            >
              Everyone
            </button>
          </div>
        </div>
      </div>
      <div className="friend-around-actions">
        <button
          type="button"
          className="friend-around-center"
          onClick={centerOnMe}
          aria-label="Center on me"
          title="Center on me"
        >
          Center on me
        </button>
      </div>
      <div className="friend-around-map">
        <div id="friend-around-map" className="friend-around-map-inner" />
      </div>
    </section>
  );
}

export default FriendAround;
