package com.smarthas.backend.model;

/**
 * Classificação da pressão arterial, calculada pelo servidor a partir da
 * diretriz simplificada da Sociedade Brasileira de Cardiologia.
 */
public enum BpClassification {
    NORMAL,
    ELEVADA,
    HAS_ESTAGIO_1,
    HAS_ESTAGIO_2,
    CRISE_HIPERTENSIVA;

    public static BpClassification classify(int systolic, int diastolic) {
        if (systolic >= 180 || diastolic >= 120) {
            return CRISE_HIPERTENSIVA;
        }
        if (systolic >= 140 || diastolic >= 90) {
            return HAS_ESTAGIO_2;
        }
        if (systolic >= 130 || diastolic >= 80) {
            return HAS_ESTAGIO_1;
        }
        if (systolic >= 120) {
            return ELEVADA;
        }
        return NORMAL;
    }
}
