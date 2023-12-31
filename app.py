import os
from pathlib import Path
from flask import Flask, render_template, json
from webpack_boilerplate.config import setup_jinja2_ext
from era5 import ERA5


BASE_DIR = Path(__file__).parent
app = Flask(__name__, static_folder="frontend/build", static_url_path="/static/")
app.config.update({
    'WEBPACK_LOADER': {
        'MANIFEST_FILE': BASE_DIR / "frontend/build/manifest.json",
    }
})
setup_jinja2_ext(app)


@app.cli.command("webpack_init")
def webpack_init():
    from cookiecutter.main import cookiecutter
    import webpack_boilerplate
    pkg_path = os.path.dirname(webpack_boilerplate.__file__)
    cookiecutter(pkg_path, directory="frontend_template")


@app.route("/")
def hello():
    era = ERA5('2017-01-01')
    print(era.ds)
    return render_template('index.html', datos={
        'temp': json.jsonify(era.ds.t[150].values.tolist()),
        'fecha': era.ds.t[150].values
        })

@app.route("/api/<year>/<mes>/<dia>")
def api(year, mes, dia):
    fecha = f'{year}-{mes}-{dia}'
    era = ERA5(fecha)
    return render_template('datos.html', datos={'datos': era.get_temp()})

@app.route("/api/<year>/<mes>/<dia>/<offset>")
def api_(year, mes, dia, offset):
    fecha = f'{year}-{mes}-{dia}'
    era = ERA5(fecha)
    return render_template('datos.html', datos=era.get_offset(offset))

@app.route("/mapa")
def mapa():
    return render_template('mapa.html')
