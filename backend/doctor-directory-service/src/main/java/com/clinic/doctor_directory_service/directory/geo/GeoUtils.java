package com.clinic.doctor_directory_service.directory.geo;

public final class GeoUtils {

    private static final double EARTH_RADIUS_KM = 6371.0088;

    private GeoUtils() {
    }

    /** Distance à vol d'oiseau (formule de Haversine), en kilomètres. */
    public static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1.0, Math.sqrt(a)));
    }

    /** Rectangle qui contient le cercle de rayon donné : pré-filtre rapide fait par la base. */
    public static BoundingBox boundingBox(double lat, double lng, double radiusKm) {
        double angular = radiusKm / EARTH_RADIUS_KM;
        double latDelta = Math.toDegrees(angular);
        double cosLat = Math.cos(Math.toRadians(lat));
        double lngDelta = 180.0;
        if (cosLat > 1e-9) {
            double ratio = Math.sin(angular) / cosLat;
            if (ratio < 1.0) {
                lngDelta = Math.toDegrees(Math.asin(ratio));
            }
        }
        return new BoundingBox(lat - latDelta, lat + latDelta, lng - lngDelta, lng + lngDelta);
    }

    public record BoundingBox(double minLat, double maxLat, double minLng, double maxLng) {
    }
}