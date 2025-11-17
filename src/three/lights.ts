import * as THREE from 'three';

export var Lights = function (scene, floorplan) {

  var scope = this;
  var scene = scene;
  var floorplan = floorplan;

    var tol = 1;
    var height = 300; // TODO: share with Blueprint.Wall

    var dirLight;

    this.getDirLight = function () {
      return dirLight;
    }

    function init() {
      var light = new THREE.HemisphereLight(0xffffff, 0x888888, 1.1);
      light.position.set(0, height, 0);
      scene.add(light);

      // Fixed: Set intensity to 0.5 instead of 0 (was causing items to be invisible)
      dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
      dirLight.color.setHSL(1, 1, 0.1);

      dirLight.castShadow = true;

      // Updated for Three.js r181: Use shadow.mapSize instead of shadowMapWidth/Height
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;

      // Updated for Three.js r181: Use shadow.camera.far instead of shadowCameraFar
      dirLight.shadow.camera.far = height + tol;
      // Updated for Three.js r181: Use shadow.bias instead of shadowBias
      dirLight.shadow.bias = -0.0001;
      // shadowDarkness was removed in Three.js r181
      dirLight.visible = true;

      scene.add(dirLight);
      scene.add(dirLight.target);

      floorplan.fireOnUpdatedRooms(updateShadowCamera);
    }

    function updateShadowCamera() {

      var size = floorplan.getSize();
      var d = (Math.max(size.z, size.x) + tol) / 2.0;

      var center = floorplan.getCenter();
      var pos = new THREE.Vector3(
        center.x, height, center.z);
      dirLight.position.copy(pos);
      dirLight.target.position.copy(center);

      // Updated for Three.js r181: Use shadow.camera properties directly
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.camera.updateProjectionMatrix();
    }

  init();
}