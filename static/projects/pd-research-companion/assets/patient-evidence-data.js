// Generated from the frozen illustrated cases; no participant identifiers or calendar dates.
window.PD_PATIENT_EVIDENCE = {
  "paper1": [
    {
      "id": "P1-A",
      "motor": 10.0,
      "slope": 1.3,
      "visits": 3,
      "span": 17,
      "sources": [
        {
          "name": "DaT-SPECT mean putamen SBR",
          "value": 0.835,
          "age": 0.0,
          "role": "Observed source"
        },
        {
          "name": "MoCA (out of 30)",
          "value": 19.0,
          "age": 0.0,
          "role": "Observed source"
        },
        {
          "name": "LEDD (mg/day)",
          "value": null,
          "age": null,
          "role": "Treatment context"
        },
        {
          "name": "NfL",
          "value": null,
          "age": null,
          "role": "Assay evidence"
        },
        {
          "name": "GCase",
          "value": null,
          "age": null,
          "role": "Assay evidence"
        }
      ],
      "axes": [
        {
          "name": "Dopaminergic",
          "score": -0.5644,
          "reliability": 1.0
        },
        {
          "name": "Injury / glial",
          "score": null,
          "reliability": 0.0
        },
        {
          "name": "Co-pathology / cognitive",
          "score": 0.9418,
          "reliability": 1.0
        },
        {
          "name": "Lysosomal",
          "score": null,
          "reliability": 0.0
        }
      ],
      "history": [
        {
          "month": -17,
          "value": 9.0
        },
        {
          "month": -6,
          "value": 14.0
        },
        {
          "month": 0,
          "value": 10.0
        }
      ],
      "baseline": 10.0,
      "gap": 9,
      "observed": 16.0,
      "futureMotor": 22.0,
      "forecasts": [
        {
          "name": "Clinical history",
          "value": 4.4467
        },
        {
          "name": "+ Dated values",
          "value": 7.5009
        },
        {
          "name": "+ Observation process",
          "value": 3.971
        },
        {
          "name": "Full source-time history",
          "value": 7.3173
        },
        {
          "name": "Hard evidence state",
          "value": 4.5438,
          "separate": true
        },
        {
          "name": "Continuous evidence state",
          "value": 5.8571,
          "separate": true
        }
      ],
      "uq": {
        "name": "Separate nested UQ mean",
        "center": 9.0642,
        "low": 0.0198,
        "high": 18.1087
      }
    },
    {
      "id": "P1-B",
      "motor": 11.0,
      "slope": 1.5,
      "visits": 4,
      "span": 16,
      "sources": [
        {
          "name": "DaT-SPECT mean putamen SBR",
          "value": null,
          "age": null,
          "role": "Observed source"
        },
        {
          "name": "MoCA (out of 30)",
          "value": 25.0,
          "age": 0.0,
          "role": "Observed source"
        },
        {
          "name": "LEDD (mg/day)",
          "value": 1300.0,
          "age": null,
          "role": "Treatment context"
        },
        {
          "name": "NfL",
          "value": "Recorded",
          "age": 0.0,
          "role": "Assay evidence"
        },
        {
          "name": "GCase",
          "value": "Recorded",
          "age": 14.0,
          "role": "Assay evidence"
        }
      ],
      "axes": [
        {
          "name": "Dopaminergic",
          "score": null,
          "reliability": 0.0
        },
        {
          "name": "Injury / glial",
          "score": 0.3429,
          "reliability": 1.0
        },
        {
          "name": "Co-pathology / cognitive",
          "score": 0.5071,
          "reliability": 1.0
        },
        {
          "name": "Lysosomal",
          "score": 0.5405,
          "reliability": 0.6674
        }
      ],
      "history": [
        {
          "month": -16,
          "value": 7.0
        },
        {
          "month": -14,
          "value": 12.0
        },
        {
          "month": -7,
          "value": 11.0
        },
        {
          "month": 0,
          "value": 11.0
        }
      ],
      "baseline": 11.0,
      "gap": 12,
      "observed": 8.0,
      "futureMotor": 19.0,
      "forecasts": [
        {
          "name": "Clinical history",
          "value": 1.7589
        },
        {
          "name": "+ Dated values",
          "value": 2.8479
        },
        {
          "name": "+ Observation process",
          "value": 2.221
        },
        {
          "name": "Full source-time history",
          "value": 2.463
        },
        {
          "name": "Hard evidence state",
          "value": 0.4228,
          "separate": true
        },
        {
          "name": "Continuous evidence state",
          "value": 1.6073,
          "separate": true
        }
      ],
      "uq": {
        "name": "Separate nested UQ mean",
        "center": 3.0055,
        "low": -17.5469,
        "high": 23.5579
      }
    }
  ],
  "paper2": [
    {
      "id": "A",
      "motor": 31.0,
      "leftSbr": 0.62,
      "rightSbr": 1.07,
      "leftMotor": 9.0,
      "rightMotor": 11.0,
      "imaging": 0.2663,
      "baseline": 0.1,
      "sources": [
        {
          "name": "DaT-SPECT bilateral SBR",
          "value": "L 0.62; R 1.07",
          "age": 0.0,
          "role": "Forecast input"
        },
        {
          "name": "MoCA (out of 30)",
          "value": 25.0,
          "age": 1.0,
          "role": "Context only"
        },
        {
          "name": "SAA",
          "value": "Negative",
          "age": 1.0,
          "role": "Context only"
        },
        {
          "name": "CSF alpha-synuclein / NfL",
          "value": "P100.0 / P78.1",
          "age": 1.0,
          "role": "Context only; percentiles within 32 records"
        },
        {
          "name": "Treatment",
          "value": "state not recorded; LEDD 100 mg",
          "age": null,
          "role": "Forecast input"
        }
      ],
      "history": [
        {
          "month": -1,
          "value": 0.3913
        },
        {
          "month": 0,
          "value": 0.1
        }
      ],
      "gap": 12,
      "observed": 0.0,
      "forecasts": [
        {
          "name": "Clinical state",
          "value": 0.106
        },
        {
          "name": "+ Mean SBR",
          "value": 0.1073
        },
        {
          "name": "+ Magnitude only",
          "value": 0.1255
        },
        {
          "name": "+ Signed DaT",
          "value": 0.2486
        }
      ],
      "uq": {
        "name": "Separate CQR median",
        "center": 0.17,
        "low": -1.0,
        "high": 0.5486
      }
    },
    {
      "id": "B",
      "motor": 12.0,
      "leftSbr": 1.26,
      "rightSbr": 0.56,
      "leftMotor": 6.0,
      "rightMotor": 2.0,
      "imaging": -0.3846,
      "baseline": -0.5,
      "sources": [
        {
          "name": "DaT-SPECT bilateral SBR",
          "value": "L 1.26; R 0.56",
          "age": 0.0,
          "role": "Forecast input"
        },
        {
          "name": "MoCA (out of 30)",
          "value": 29.0,
          "age": 1.0,
          "role": "Context only"
        },
        {
          "name": "SAA",
          "value": "Positive",
          "age": 1.0,
          "role": "Context only"
        },
        {
          "name": "CSF alpha-synuclein / NfL",
          "value": "P87.5 / P68.8",
          "age": 1.0,
          "role": "Context only; percentiles within 32 records"
        },
        {
          "name": "Treatment",
          "value": "state not recorded; LEDD 100 mg",
          "age": null,
          "role": "Forecast input"
        }
      ],
      "history": [
        {
          "month": -1,
          "value": -0.2
        },
        {
          "month": 0,
          "value": -0.5
        }
      ],
      "gap": 12,
      "observed": -0.5,
      "forecasts": [
        {
          "name": "Clinical state",
          "value": -0.3218
        },
        {
          "name": "+ Mean SBR",
          "value": -0.3197
        },
        {
          "name": "+ Magnitude only",
          "value": -0.2858
        },
        {
          "name": "+ Signed DaT",
          "value": -0.4721
        }
      ],
      "uq": {
        "name": "Separate CQR median",
        "center": -0.4433,
        "low": -1.0,
        "high": -0.0885
      }
    },
    {
      "id": "C",
      "motor": 17.0,
      "leftSbr": 0.58,
      "rightSbr": 0.57,
      "leftMotor": 1.0,
      "rightMotor": 11.0,
      "imaging": -0.0087,
      "baseline": 0.8333,
      "sources": [
        {
          "name": "DaT-SPECT bilateral SBR",
          "value": "L 0.58; R 0.57",
          "age": 0.0,
          "role": "Forecast input"
        },
        {
          "name": "MoCA (out of 30)",
          "value": 29.0,
          "age": 0.0,
          "role": "Context only"
        },
        {
          "name": "SAA",
          "value": "Positive",
          "age": 0.0,
          "role": "Context only"
        },
        {
          "name": "CSF alpha-synuclein / NfL",
          "value": "P75.0 / P65.6",
          "age": 0.0,
          "role": "Context only; percentiles within 32 records"
        },
        {
          "name": "Treatment",
          "value": "state not recorded; LEDD 100 mg",
          "age": null,
          "role": "Forecast input"
        }
      ],
      "history": [
        {
          "month": 0,
          "value": 0.8333
        }
      ],
      "gap": 13,
      "observed": 0.0,
      "forecasts": [
        {
          "name": "Clinical state",
          "value": 0.6467
        },
        {
          "name": "+ Mean SBR",
          "value": 0.6514
        },
        {
          "name": "+ Magnitude only",
          "value": 0.6303
        },
        {
          "name": "+ Signed DaT",
          "value": 0.5376
        }
      ],
      "uq": {
        "name": "Separate CQR median",
        "center": 0.6025,
        "low": -1.0,
        "high": 1.0
      }
    },
    {
      "id": "D",
      "motor": 30.0,
      "leftSbr": 0.15,
      "rightSbr": 0.76,
      "leftMotor": 12.0,
      "rightMotor": 9.0,
      "imaging": 0.6703,
      "baseline": -0.1429,
      "sources": [
        {
          "name": "DaT-SPECT bilateral SBR",
          "value": "L 0.15; R 0.76",
          "age": 0.0,
          "role": "Forecast input"
        },
        {
          "name": "MoCA (out of 30)",
          "value": 27.0,
          "age": 5.0,
          "role": "Context only"
        },
        {
          "name": "SAA",
          "value": "Positive",
          "age": 5.0,
          "role": "Context only"
        },
        {
          "name": "CSF alpha-synuclein / NfL",
          "value": "P18.8 / P84.4",
          "age": 5.0,
          "role": "Context only; percentiles within 32 records"
        },
        {
          "name": "Treatment",
          "value": "state not recorded; LEDD 100 mg",
          "age": null,
          "role": "Forecast input"
        }
      ],
      "history": [
        {
          "month": -5,
          "value": -0.1429
        },
        {
          "month": -4,
          "value": 0.0
        },
        {
          "month": 0,
          "value": -0.1429
        }
      ],
      "gap": 9,
      "observed": 0.1429,
      "forecasts": [
        {
          "name": "Clinical state",
          "value": -0.0727
        },
        {
          "name": "+ Mean SBR",
          "value": -0.0671
        },
        {
          "name": "+ Magnitude only",
          "value": 0.0063
        },
        {
          "name": "+ Signed DaT",
          "value": 0.3329
        }
      ],
      "uq": {
        "name": "Separate CQR median",
        "center": -0.0306,
        "low": -1.0,
        "high": 0.3334
      }
    }
  ]
};
