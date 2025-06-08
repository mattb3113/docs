/**
 * @file tax-tables.js
 * @description Comprehensive Tax Data Repository for 2025.
 * This module centralizes all required Federal and New Jersey tax data for the year 2025.
 * It is designed to be a single source of truth for tax calculations within the application.
 * Data is based on the provided specifications and existing project JSON files for consistency.
 */

const TaxTables2025 = {
    /**
     * Federal Tax Data for 2025
     */
    federal: {
        // Federal Income Tax Brackets for different filing statuses.
        // Each bracket defines the tax rate for a specific income range.
        incomeTax: {
            single: [
                { rate: 0.10, min: 0, max: 11600 },
                { rate: 0.12, min: 11601, max: 47150 },
                { rate: 0.22, min: 47151, max: 100525 },
                { rate: 0.24, min: 100526, max: 191950 },
                { rate: 0.32, min: 191951, max: 243725 },
                { rate: 0.35, min: 243726, max: 609350 },
                { rate: 0.37, min: 609351, max: Infinity }
            ],
            marriedJointly: [
                { rate: 0.10, min: 0, max: 23200 },
                { rate: 0.12, min: 23201, max: 94300 },
                { rate: 0.22, min: 94301, max: 201050 },
                { rate: 0.24, min: 201051, max: 383900 },
                { rate: 0.32, min: 383901, max: 487450 },
                { rate: 0.35, min: 487451, max: 731200 },
                { rate: 0.37, min: 731201, max: Infinity }
            ],
            // Head of Household status is included as requested.
            headOfHousehold: [
                { rate: 0.10, min: 0, max: 16550 },
                { rate: 0.12, min: 16551, max: 59850 },
                { rate: 0.22, min: 59851, max: 95350 },
                { rate: 0.24, min: 95351, max: 182100 },
                { rate: 0.32, min: 182101, max: 231250 },
                { rate: 0.35, min: 231251, max: 578100 },
                { rate: 0.37, min: 578101, max: Infinity }
            ]
        },
        // Standard deduction amounts reduce taxable income.
        standardDeductions: {
            single: 14600,
            marriedJointly: 29200,
            headOfHousehold: 21900
        },
        // FICA (Federal Insurance Contributions Act) tax rates and limits.
        fica: {
            socialSecurity: {
                rate: 0.062,
                wageBase: 177300 // Maximum earnings subject to Social Security tax.
            },
            medicare: {
                rate: 0.0145,
                additionalRate: 0.009, // Additional rate for high earners.
                threshold: 200000 // Income threshold for the additional Medicare tax.
            }
        }
    },

    /**
     * New Jersey State Tax Data for 2025
     */
    newJersey: {
        // NJ Income Tax Brackets. Note: NJ has more complex filing statuses,
        // but a default set is provided as per the request.
        incomeTax: {
            // Assuming a default/single-like filing status based on provided data.
            default: [
                { rate: 0.014, min: 0, max: 20000 },
                { rate: 0.0175, min: 20001, max: 35000 },
                { rate: 0.035, min: 35001, max: 40000 },
                { rate: 0.05525, min: 40001, max: 75000 },
                { rate: 0.0637, min: 75001, max: 500000 },
                { rate: 0.0897, min: 500001, max: 1000000 },
                { rate: 0.1075, min: 1000001, max: Infinity }
            ]
        },
        // State Disability Insurance (employee contribution).
        sdi: {
            rate: 0.00, // Rate for 2025 as per project JSON
            wageBase: 169000
        },
        // Family Leave Insurance (employee contribution).
        fli: {
            rate: 0.0006, // Rate for 2025 as per project JSON
            wageBase: 169000
        },
        // State Unemployment Insurance / Health Care / Workforce Development fund.
        // This is typically employer-paid but included for reference.
        sui: {
            rate: 0.00425,
            wageBase: 43800
        }
    },

    /**
     * Local Tax Data for specific municipalities.
     */
    local: {
        cities: {
            newark: {
                rate: 0.01, // 1% Newark payroll tax.
                quarterlyThreshold: 2500 // Tax applies if quarterly payroll is $2,500 or more.
            }
        }
    }
};

export default TaxTables2025;
