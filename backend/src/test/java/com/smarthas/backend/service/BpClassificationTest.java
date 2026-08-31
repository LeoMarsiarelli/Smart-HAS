package com.smarthas.backend.service;

import com.smarthas.backend.model.BpClassification;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class BpClassificationTest {

    @Test
    void classifiesNormal() {
        assertEquals(BpClassification.NORMAL, BpClassification.classify(115, 75));
    }

    @Test
    void classifiesElevada() {
        assertEquals(BpClassification.ELEVADA, BpClassification.classify(125, 78));
    }

    @Test
    void classifiesEstagio1() {
        assertEquals(BpClassification.HAS_ESTAGIO_1, BpClassification.classify(135, 85));
    }

    @Test
    void classifiesEstagio2() {
        assertEquals(BpClassification.HAS_ESTAGIO_2, BpClassification.classify(150, 95));
    }

    @Test
    void classifiesCrise() {
        assertEquals(BpClassification.CRISE_HIPERTENSIVA, BpClassification.classify(185, 100));
    }
}
