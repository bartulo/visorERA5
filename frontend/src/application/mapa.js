import { 
  DataTexture, 
  Scene, 
  PerspectiveCamera, 
  WebGLRenderer,
  AmbientLight,
  Mesh,
  RedFormat,
  FloatType,
  ShaderMaterial,
  PlaneGeometry,
  LinearFilter,
  Clock,
  TextureLoader
} from 'three';
import {Pane} from 'tweakpane';

class Mapa {
  constructor() {
    this.clock = new Clock();
    this.pausedTime = 0;
    this.anim_speed = 1;
    this.playButton = document.getElementById('play');
    this.stopButton = document.getElementById('stop');
    this.animRange = document.getElementById('rangeAnim');
    this.animRange.value = 0;

    this.playButton.addEventListener('click', () => {
      if (this.clock.running == false) {
        this.clock.start();
        this.clock.elapsedTime = this.pausedTime;
        this.render();
      }
    });
    this.stopButton.addEventListener('click', () => {
      this.pausedTime = this.clock.elapsedTime;
      this.clock.stop();
    });
    this.api_url = window.location.pathname.replace('mapa', 'api');
    this.planeVS = require('../shaders/planeVS.glsl');
    this.planeFS = require('../shaders/planeFS.glsl');
    this.europa_img = require('../../vendors/images/europa.png');
  }

  async get_datos() {
    const response = await fetch(this.api_url + '/10');
    this.datos = await response.json();
    console.log(this.datos.datos);
    this.width = this.datos.datos[0].length;
    this.height = this.datos.datos[0][0].length;
    this.temp_textures = [];
    
    await Promise.all(this.datos.datos.map(async (element) => {
//    this.datos.datos.forEach((element) => {
      const tarray = element.flat();
      const tarray32 = new Float32Array(tarray);
      const texture = new DataTexture(tarray32, this.height, this.width, RedFormat, FloatType);
      texture.internalFormat = 'R16F';
      texture.magFilter = LinearFilter;
      texture.flipY = true;
      texture.needsUpdate = true;
      this.temp_textures.push(texture);
    }));

  }

  init() {
    const PARAMS = {
      tmax: 30,
      tmin: 0,
      speed: 1
    };
    const pane = new Pane();
    this.tmaxPane = pane.addBinding(
      PARAMS, 'tmax',
      {min: 0, max: 40, step:1}
    );
    this.tminPane = pane.addBinding(
      PARAMS, 'tmin',
      {min: -30, max: 10, step:1}
    );
    this.speedPane = pane.addBinding(
      PARAMS, 'speed',
      {min: 0.1, max: 5, step:0.1}
    );
    this.animRange.min = 0;
    this.animRange.max = this.anim_speed * (this.temp_textures.length - 1);
    this.animRange.step = 0.1;

    this.tmin=0;
    this.tmax=30;

    this.time = 0;
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.camera.position.z = 380;
    const ambientLight = new AmbientLight(0xffffff, 5.9);
    this.scene.add(ambientLight);

    this.europa = new TextureLoader().load(this.europa_img);
    this.europa.needsUpdate = true;

    const uniforms = {
      tmin: {type: 'f', value: this.tmin},
      tmax: {type: 'f', value: this.tmax},
      time: {type: 'f', value: this.time},
      anim_speed: {type: 'f', value: this.anim_speed},
      europa: {type: 't', value: this.europa},
      temp_ini: {type: 't', value: this.temp_textures[0]},
      temp_fin: {type: 't', value: this.temp_textures[1]}
    };
    
    this.material = new ShaderMaterial({
      uniforms: uniforms,
      vertexShader: this.planeVS,
      fragmentShader: this.planeFS
    });
    const geom = new PlaneGeometry(680, 680 * this.width / this.height, 1, 1);
    this.material.needsUpdate = true;

    const plane = new Mesh(geom, this.material);
    this.scene.add(plane);

    this.tminPane.on('change', (el) => {
      this.tmin = el.value;
      this.material.uniforms.tmin.value = this.tmin;
      this.render();
    });

    this.tmaxPane.on('change', (el) => {
      this.tmax = el.value;
      this.material.uniforms.tmax.value = this.tmax;
      this.render();
    });

    this.speedPane.on('change', (el) => {
      this.anim_speed = 1 / el.value;
      this.material.uniforms.anim_speed.value = this.anim_speed;
      this.animRange.max = this.anim_speed * (this.temp_textures.length - 1);
    });

    this.render();

  }

  render() {
    if (this.clock.running == true) {
      requestAnimationFrame(this.render.bind(this));
      const index = Math.floor(this.clock.getElapsedTime() / this.anim_speed);
      this.material.uniforms.temp_ini.value = this.temp_textures[index];
      this.material.uniforms.temp_fin.value = this.temp_textures[index + 1];
      this.time = ( this.clock.elapsedTime % this.anim_speed ) / this.anim_speed;
      this.material.uniforms.time.value = this.time;
      this.animRange.value = this.clock.getElapsedTime();

      if (this.clock.elapsedTime > this.anim_speed * (this.temp_textures.length - 1)) {
        this.clock.elapsedTime = 0;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

}

const mapa = new Mapa();
document.body.addEventListener('click', () => {
  console.log(mapa.clock.elapsedTime);
});
mapa.get_datos().then(() => {
  mapa.init();
});
