package com.clinic.doctor_directory_service.directory.geo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import org.junit.jupiter.api.Test;

import com.clinic.doctor_directory_service.directory.geo.GeoUtils.BoundingBox;

class GeoUtilsTest {

    @Test
    void distanceBetweenTunisAndSfaxIsAbout236Km() {
        assertThat(GeoUtils.distanceKm(36.8065, 10.1815, 34.7406, 10.7603)).isCloseTo(235.6, within(1.0));
    }

    @Test
    void distanceToTheSamePointIsZero() {
        assertThat(GeoUtils.distanceKm(36.8, 10.2, 36.8, 10.2)).isZero();
    }

    @Test
    void boundingBoxSurroundsTheCenter() {
        BoundingBox box = GeoUtils.boundingBox(36.8, 10.2, 50);

        assertThat(box.maxLat() - 36.8).isCloseTo(0.45, within(0.01));
        assertThat(36.8 - box.minLat()).isCloseTo(0.45, within(0.01));
        assertThat(box.minLng()).isLessThan(10.2);
        assertThat(box.maxLng()).isGreaterThan(10.2);
    }
}