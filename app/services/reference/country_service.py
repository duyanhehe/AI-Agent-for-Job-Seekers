import pycountry


def get_countries():
    """Return a sorted list of country names from pycountry."""
    countries = [country.name for country in pycountry.countries]

    return sorted(countries)
