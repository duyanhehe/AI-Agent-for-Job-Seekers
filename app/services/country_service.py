import pycountry


def get_countries():

    countries = [country.name for country in pycountry.countries]

    return sorted(countries)
