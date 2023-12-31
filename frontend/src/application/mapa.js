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
  TextureLoader,
} from 'three';
import {Pane} from 'tweakpane';
import datepicker from 'js-datepicker';

class Mapa {
  constructor() {
    this.clock = new Clock();
    this.pausedTime = 0;
    this.anim_speed = 1;
    this.perc = 0;
    this.playButton = document.getElementById('play');
    this.stopButton = document.getElementById('stop');
    this.animRange = document.getElementById('rangeAnim');
    this.animRange.value = 0;
    this.fechasDiv = document.getElementById('fecha');
    this.mostrarButton = document.getElementById('mostrar');
    this.containerAnim = document.getElementById('containerAnim');

    const pickerStart = datepicker('#datepicker', {
      id: 1,
      alwaysShow: true,
      position: 'bl',
      startDay: 1,
      customDays: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
      overlayPlaceholder: 'Introducir año',
      customMonths: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      onSelect: (instance) => {
        if (pickerEnd.dateSelected) {
          this.mostrarButton.removeAttribute('disabled');
          const start = instance.getRange().start;
          const end = instance.getRange().end;
          const dias = (end.getTime()-start.getTime())/(1000*60*60*24);
          const year = start.getFullYear();
          const mes = start.getMonth() + 1;
          const dia = start.getDate();
          this.api_url = '/api/' + year + '/' + mes+ '/' + dia + '/' + dias;
        }
      }
    });
    const pickerEnd = datepicker('#datepicker2', {
      id: 1,
      alwaysShow: true,
      position: 'bl',
      startDay: 1,
      customDays: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
      overlayPlaceholder: 'Introducir año',
      customMonths: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      onSelect: (instance) => {
        if (pickerStart.dateSelected) {
          this.mostrarButton.removeAttribute('disabled');
          const start = instance.getRange().start;
          const end = instance.getRange().end;
          const dias = (end.getTime()-start.getTime())/(1000*60*60*24) + 1;
          const year = start.getFullYear();
          const mes = start.getMonth() + 1;
          const dia = start.getDate();
          this.api_url = '/api/' + year + '/' + mes+ '/' + dia + '/' + dias;

        }
    
      }
    });

    this.mostrarButton.addEventListener('click', () => {
      if (this.containerAnim.children.length > 0) {
        this.containerAnim.removeChild(this.containerAnim.children[0]);
      }
      this.get_datos().then(() => {
        this.init();
      });
    });

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

    this.planeVS = require('../shaders/planeVS.glsl');
    this.planeFS = require('../shaders/planeFS.glsl');
    this.europa_img = require('../../vendors/images/europa.png');
  }

  async get_datos() {
    const response = await fetch(this.api_url);
    this.datos = await response.json();
    this.fechas = await this.datos.time;
    this.width = this.datos.temp[0].length;
    this.height = this.datos.temp[0][0].length;
    this.temp_textures = [];
    this.press_textures = [];
    
    await Promise.all(this.datos.temp.map(async (element) => {
      const tarray = element.flat();
      const tarray32 = new Float32Array(tarray);
      const texture = new DataTexture(tarray32, this.height, this.width, RedFormat, FloatType);
      texture.internalFormat = 'R16F';
      texture.magFilter = LinearFilter;
      texture.flipY = true;
      texture.needsUpdate = true;
      this.temp_textures.push(texture);
    }));

    await Promise.all(this.datos.presion.map(async (element) => {
      const tarray = element.flat();
      const tarray32 = new Float32Array(tarray);
      const texture = new DataTexture(tarray32, this.height, this.width, RedFormat, FloatType);
      texture.internalFormat = 'R32F';
      texture.magFilter = LinearFilter;
      texture.flipY = true;
      texture.needsUpdate = true;
      this.press_textures.push(texture);
    }));


  }

  init() {
    const PARAMS = {
      tmax: 30,
      tmin: 0,
      speed: 1,
      tempIntBool: false,
      step: 60,
      interpolation: true,
      isoBool: false,
      isoDistance: 5,
      isoBuffer: 20
    };
    const pane = new Pane();
    this.tmaxPane = pane.addBinding(
      PARAMS, 'tmax',
      {min: 0, max: 40, step:1}
    );
    this.tminPane = pane.addBinding(
      PARAMS, 'tmin',
      {min: -30, max: 25, step:1}
    );
    this.speedPane = pane.addBinding(
      PARAMS, 'speed',
      {min: 0.1, max: 5, step:0.1}
    );
    this.tempIntBoolPane = pane.addBinding(
      PARAMS, 'tempIntBool');
    this.stepPane = pane.addBinding(
      PARAMS, 'step',
      {min: 2, max: 80, step:1}
    );
    this.interpolationPane = pane.addBinding(
      PARAMS, 'interpolation');

    this.isoBoolPane = pane.addBinding(
      PARAMS, 'isoBool');

    this.isoDistancePane = pane.addBinding(
      PARAMS, 'isoDistance',
      {min: 1, max: 5, step:1}
    );
    this.isoBufferPane = pane.addBinding(
      PARAMS, 'isoBuffer',
      {min: 5, max: 20, step:1}
    );
    this.animRange.min = 0;
    this.animRange.max = this.anim_speed * (this.temp_textures.length - 1);
    this.animRange.step = 0.1;

    this.animRange.addEventListener('input', () => {
      this.clock.elapsedTime = parseInt(this.animRange.value);
      this.pausedTime = parseInt(this.animRange.value);
      this.renderAnim();
    });

    this.tmin=0;
    this.tmax=30;

    this.time = 0;
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, this.height / this.width, 0.1, 1000);
    this.renderer = new WebGLRenderer({antialias: true});
    this.renderer.setSize(680 * 1.3 , 680 * 1.3  * this.width / this.height);
    this.containerAnim.appendChild(this.renderer.domElement);

    this.camera.position.z = 355;
    const ambientLight = new AmbientLight(0xffffff, 5.9);
    this.scene.add(ambientLight);

    this.europa = new TextureLoader().load(this.europa_img, () => {
      this.europa.needsUpdate = true;
      this.renderAnim();
    });

    const uniforms = {
      tmin: {type: 'f', value: this.tmin},
      tmax: {type: 'f', value: this.tmax},
      time: {type: 'f', value: this.time},
      anim_speed: {type: 'f', value: this.anim_speed},
      tempIntBool: {type: 'f', value: 0},
      stepTemp: {type: 'f', value: 60},
      interpolation: {type: 'f', value: 1},
      isoBool: {type: 'f', value: 0},
      isoDistance: {type: 'f', value: 5},
      isoBuffer: {type: 'f', value: 20},
      europa: {type: 't', value: this.europa},
      temp_ini: {type: 't', value: this.temp_textures[0]},
      temp_fin: {type: 't', value: this.temp_textures[1]},
      press_ini: {type: 't', value: this.press_textures[0]},
      press_fin: {type: 't', value: this.press_textures[1]}
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
      this.renderAnim();
    });

    this.tmaxPane.on('change', (el) => {
      this.tmax = el.value;
      this.material.uniforms.tmax.value = this.tmax;
      this.renderAnim();
    });

    this.speedPane.on('change', (el) => {
      this.anim_speed = 1 / el.value;
      this.clock.elapsedTime = this.perc * this.anim_speed * (this.temp_textures.length - 1);
      this.material.uniforms.anim_speed.value = this.anim_speed;
      this.animRange.max = this.anim_speed * (this.temp_textures.length - 1);
      this.animRange.value = this.clock.elapsedTime;
      this.pausedTime = this.clock.elapsedTime;
      this.perc = this.clock.elapsedTime / (this.anim_speed * (this.temp_textures.length -1));
    });

    this.tempIntBoolPane.on('change', (el) => {
      if (el.value == true) {
        this.material.uniforms.tempIntBool.value = 1;
      } else {
        this.material.uniforms.tempIntBool.value = 0;
      }

      this.renderAnim();
    });

    this.stepPane.on('change', (el) => {
      this.material.uniforms.stepTemp.value = parseFloat(el.value);
      this.renderAnim();
    });

    this.interpolationPane.on('change', (el) => {
      if (el.value == true) {
        this.material.uniforms.interpolation.value = 1;
      } else {
        this.material.uniforms.interpolation.value = 0;
      }

      this.renderAnim();
    });

    this.isoBoolPane.on('change', (el) => {
      if (el.value == true) {
        this.material.uniforms.isoBool.value = 1;
      } else {
        this.material.uniforms.isoBool.value = 0;
      }

      this.renderAnim();
    });

    this.isoDistancePane.on('change', (el) => {
      this.material.uniforms.isoDistance.value = parseFloat(el.value);
      this.renderAnim();
    });
    
    this.isoBufferPane.on('change', (el) => {
      this.material.uniforms.isoBuffer.value = parseFloat(el.value);
      this.renderAnim();
    });

    this.renderAnim();

  }

  renderAnim(){
    const index = Math.floor(this.clock.elapsedTime / this.anim_speed);
    this.material.uniforms.temp_ini.value = this.temp_textures[index];
    this.material.uniforms.temp_fin.value = this.temp_textures[index + 1];
    this.material.uniforms.press_ini.value = this.press_textures[index];
    this.material.uniforms.press_fin.value = this.press_textures[index + 1];
    this.time = ( this.clock.elapsedTime % this.anim_speed ) / this.anim_speed;
    this.material.uniforms.time.value = this.time;
    this.perc = this.clock.elapsedTime / (this.anim_speed * (this.temp_textures.length - 1));
    this.fechasDiv.innerHTML = this.fechas[index];

    if (this.clock.elapsedTime > this.anim_speed * (this.temp_textures.length - 1)) {
      this.clock.elapsedTime = 0;
    }
    this.renderer.render(this.scene, this.camera);
  }

  render() {
    if (this.clock.running == true) {
      requestAnimationFrame(this.render.bind(this));
      this.animRange.value = this.clock.getElapsedTime();
      this.renderAnim();
    }
  }

}

const mapa = new Mapa();
