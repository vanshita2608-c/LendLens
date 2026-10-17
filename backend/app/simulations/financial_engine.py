from typing import Dict, Any

class FinancialContributionEngine:
    """
    Transparent financial calculation service implementing standard retail banking
    unit economics, net contribution, and Expected Credit Loss (ECL).
    
    Formula:
      Net Contribution = Gross Interest Income 
                       + Origination Fee Income 
                       - Funding Costs 
                       - Operating / Implementation Costs 
                       - Expected Credit Losses (ECL)
    """
    @staticmethod
    def calculate_expected_credit_loss(
        exposure_at_default: float,
        probability_of_default: float,
        loss_given_default: float = 0.45
    ) -> float:
        """
        ECL = EAD * PD * LGD
        Retail unsecured standard: LGD = 45% (0.45)
        """
        if exposure_at_default <= 0 or probability_of_default <= 0 or loss_given_default <= 0:
            return 0.0
        return round(exposure_at_default * probability_of_default * loss_given_default, 2)

    @staticmethod
    def calculate_financial_contribution(
        disbursed_principal: float,
        annual_interest_rate_pct: float,
        avg_tenure_months: int,
        probability_of_default: float,
        cost_of_funds_pct: float = 7.5,
        origination_fee_pct: float = 2.0,
        operating_cost_inr: float = 0.0,
        loss_given_default_pct: float = 45.0
    ) -> Dict[str, Any]:
        """
        Calculates complete profit & loss breakdown for a loan cohort.
        """
        if disbursed_principal <= 0:
            return {
                "disbursed_principal": 0.0,
                "gross_interest_income": 0.0,
                "fee_income": 0.0,
                "total_revenue": 0.0,
                "funding_cost": 0.0,
                "expected_credit_loss": 0.0,
                "operating_cost": 0.0,
                "total_expenses": 0.0,
                "net_contribution": 0.0,
                "net_interest_margin_pct": 0.0,
                "return_on_disbursed_capital_pct": 0.0
            }

        tenure_years = avg_tenure_months / 12.0
        
        # Reducing balance average balance factor is approximately 52% of initial principal over tenure
        avg_balance_factor = 0.525
        avg_earning_assets = disbursed_principal * avg_balance_factor

        # 1. Gross Interest Income
        gross_interest = avg_earning_assets * (annual_interest_rate_pct / 100.0) * tenure_years

        # 2. Upfront Origination Fee Income
        fee_income = disbursed_principal * (origination_fee_pct / 100.0)

        # 3. Total Revenue
        total_revenue = gross_interest + fee_income

        # 4. Funding Cost (Cost of Capital to fund the loan book)
        funding_cost = avg_earning_assets * (cost_of_funds_pct / 100.0) * tenure_years

        # 5. Expected Credit Loss (ECL = EAD * PD * LGD)
        # Exposure At Default on average across tenure ~ 75% of principal
        ead = disbursed_principal * 0.75
        lgd = loss_given_default_pct / 100.0
        ecl = ead * probability_of_default * lgd

        # 6. Total Expenses
        total_expenses = funding_cost + ecl + operating_cost_inr

        # 7. Net Contribution
        net_contribution = total_revenue - total_expenses

        # 8. Financial Ratios (Annualized NIM standard)
        nim = ((gross_interest - funding_cost) / (avg_earning_assets * tenure_years) * 100.0) if (avg_earning_assets > 0 and tenure_years > 0) else 0.0
        rodc = (net_contribution / disbursed_principal * 100.0) if disbursed_principal > 0 else 0.0

        return {
            "disbursed_principal": round(disbursed_principal, 2),
            "gross_interest_income": round(gross_interest, 2),
            "fee_income": round(fee_income, 2),
            "total_revenue": round(total_revenue, 2),
            "funding_cost": round(funding_cost, 2),
            "expected_credit_loss": round(ecl, 2),
            "operating_cost": round(operating_cost_inr, 2),
            "total_expenses": round(total_expenses, 2),
            "net_contribution": round(net_contribution, 2),
            "net_interest_margin_pct": round(nim, 2),
            "return_on_disbursed_capital_pct": round(rodc, 2)
        }
