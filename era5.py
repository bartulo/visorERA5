import cdsapi
import xarray as xr
import datetime

class ERA5():
    def __init__(self, fecha):
        self.fecha = fecha
        year = fecha.split('-')[0]
        self.ds = xr.load_dataset(f'datos/download_{year}.grib', engine='cfgrib')

    def get_temp(self):
        temp = self.ds.sel(time=self.fecha, isobaricInhPa='850').t.values.tolist()
        return temp

    def get_offset(self, offset):
        fecha_dt = datetime.datetime.strptime(self.fecha, '%Y-%m-%d')
        fechas = []
        for t in ['00', '06', '12', '18']:
            for d in range(int(offset)):
                fechas.append(f'{(fecha_dt + datetime.timedelta(days=d)).strftime("%Y-%m-%d")}T{t}')
        temp = self.ds.sel(time=fechas, isobaricInhPa='850').t.values.tolist()
        return temp

    def download(self, year):
        self.latmax = 65
        self.latmin = 33
        self.longmax = 30
        self.longmin = -10

        if year % 4 == 0:
            days = 366
        else:
            days = 365

        fini = datetime.datetime.strptime(f'{year}-01-01', '%Y-%m-%d')
        fechas = [(fini + datetime.timedelta(days=x)).strftime('%Y-%m-%d') for x in range(days)]

        c = cdsapi.Client()
        c.retrieve("reanalysis-era5-complete",
            {
            "date": fechas,
            "levelist": ["850", "500"],
            # "levtype": "ml",
            "param": ["130"],
            "time": ["00:00", "06:00", "12:00", "18:00"],
            "area": f"{self.latmax}/{self.longmin}/{self.latmin}/{self.longmax}",
            "grid": "0.25/0.25"
            }, f"datos/download_{year}.grib")


