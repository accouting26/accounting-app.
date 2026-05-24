import requests
from core.config import settings
import logging

logger = logging.getLogger(__name__)

class CurrencyService:
    @staticmethod
    def get_exchange_rate(from_currency: str, to_currency: str = "USD") -> float:
        """
        Get exchange rate from from_currency to to_currency.
        Returns 1.0 if currencies are the same.
        """
        if from_currency == to_currency:
            return 1.0
        
        if settings.MOCK_MODE:
            # Deterministic mock rates
            mock_rates = {
                "EUR": 1.08,
                "GBP": 1.27,
                "CAD": 0.73,
                "AUD": 0.66,
                "JPY": 0.0064
            }
            return mock_rates.get(from_currency.upper(), 1.0)
        
        try:
            # Using a free API (limited) or similar
            # For production, use a dedicated key
            response = requests.get(f"https://api.exchangerate-api.com/v4/latest/{from_currency.upper()}")
            data = response.json()
            return data["rates"].get(to_currency.upper(), 1.0)
        except Exception as e:
            logger.error(f"Error fetching exchange rate: {e}")
            # Fallback to a default or mock if API fails
            return 1.0

    @staticmethod
    def convert_to_usd(amount: float, from_currency: str) -> tuple[float, float]:
        """
        Convert amount from from_currency to USD.
        Returns (converted_amount, exchange_rate).
        """
        rate = CurrencyService.get_exchange_rate(from_currency, "USD")
        return round(amount * rate, 2), rate
