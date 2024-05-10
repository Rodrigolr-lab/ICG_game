import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { gsap } from 'gsap';
import { Matrix4 } from 'three';
import RAPIER from '@dimforge/rapier3d';
import * as CANNON from 'cannon';
// game physics?
let camera, scene, renderer;
let world;
// let gameStarted = false;

let keysPressed = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
};

const Game = () => {
    const mountRef = useRef(null);
    const snakeBody = [];
    let snakeLength = 3;


    useEffect(() => {
        // Cannon.js
        // Setup our world
        world = new CANNON.World();
        world.gravity.set(0, 0, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);

        // Camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // camera.position.set(5, 5, 0);
        // camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.setSize(window.innerWidth, window.innerHeight);

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();

        // lights
        const light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(0, 100, 0).normalize();
        // light.shadow.camera.near = 0.1;
        // light.shadow.camera.far = 1024;
        light.castShadow = true;
        // teste para corrigir sombras 
        // light.shadow.mapSize.width = 1024; // default is 512
        // light.shadow.mapSize.height = 1024; // default is 512
        scene.add(light);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        // ambientLight.castShadow = true;
        scene.add(ambientLight);

        // Axes Helper
        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.position.set(1, 1, 1); // Move the axes helper to the position (1, 1, 1)
        scene.add(axesHelper);

        // The X-axis is red.
        // The Y-axis is green.
        // The Z-axis is blue.

        // Mount using ref
        mountRef.current.appendChild(renderer.domElement);

        function generateSpheres(scene) {
            const spheres = [];
            const spheresBox = [];
            const shephersBodies = [];


            // Generate random spheres
            for (let i = 0; i < 100; i++) {
                const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
                const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.castShadow = true;
                sphere.receiveShadow = true;
                // let sphereBox = new THREE.Sphere(sphere.position, 0.5);
                // spheresBox.push(sphereBox);

                const shape = new CANNON.Sphere(new CANNON.Vec3(0.5 / 2, 32 / 2, 32 / 2));
                // ele tem uma condicao a definir se cai ou nao
                let mass = 0;
                let body = new CANNON.Body({ mass });
                body.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
                world.addBody(body);
                shephersBodies.push(body);

                // Set the position to a random value
                sphere.position.x = Math.random() * 20 - 10;
                sphere.position.y = Math.random() * 20 - 10;
                sphere.position.z = Math.random() * 20 - 10;

                scene.add(sphere);
                spheres.push(sphere);
            }

            return { spheres, spheresBox, shephersBodies };
        }

        let { spheres, spheresBox, shephersBodies } = generateSpheres(scene);

        // Create a cube
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        const shape = new CANNON.Box(new CANNON.Vec3(1 / 2, 1 / 2, 1 / 2));
        // ele tem uma condicao a definir se cai ou nao
        let mass = 7;
        let body = new CANNON.Body({ mass });
        body.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
        world.addBody(body);
        shephersBodies.push(body);
        // cube.rotateX(Math.PI / 4);
        // cube.castShadow = true;// Create an AxesHelper with a size of 1
        let axesHelpercube = new THREE.AxesHelper(1);

        // Add it as a child of the cube
        cube.add(axesHelpercube);
        cube.receiveShadow = true;

        scene.add(cube);

        // Get the bounding box of the cube
        let cubeBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        cubeBox.setFromObject(cube);


        // Create a plane
        const planeGeometry = new THREE.PlaneGeometry(50, 50);
        const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.position.y = -10; // Move the plane down by 1 unit
        plane.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal  
        plane.receiveShadow = true;
        scene.add(plane);


        window.addEventListener('keydown', (event) => {
            if (event.key === 'w' || event.key === 'a' || event.key === 's' || event.key === 'd' || event.key === ' ') {
                keysPressed[event.key] = true;
            }
        });

        window.addEventListener('keyup', (event) => {
            if (event.key === 'w' || event.key === 'a' || event.key === 's' || event.key === 'd' || event.key === ' ') {
                keysPressed[event.key] = false;
            }
        });

        function startGame(event) {
            event.code === 'Space' ? gameStarted = true : gameStarted = false;
            console.log(gameStarted);
        }


        // link : https://www.youtube.com/watch?v=9H3HPq-BTMo
        // video de onde tirei as colisoes 

        const spheresToRemove = [];

        function checkCollisions() {
            for (const sphere of spheresBox) {
                if (cubeBox.intersectsSphere(sphere)) {
                    console.log('collision detected');
                    // spheresToRemove.push(sphere);
                }
            }
        }


        // Previous position of the cube
        let previousPosition = new CANNON.Vec3().copy(cube.position);
        // velocidaded incial
        let localNegativeXAxis = new THREE.Vector3(0, 0, -2).applyQuaternion(cube.quaternion);
        // angulo de rotacao
        let turningangle = 0.05;

        let brake = true;

        function updatePhysics() {
            console.log(body.velocity.x, body.velocity.y, body.velocity.z);
            // define the cubes X axis
            let localXAxis = new THREE.Vector3(2, 0, 0).applyQuaternion(cube.quaternion);
            //  define the cubes Y axis
            let localYAxis = new THREE.Vector3(0, 2, 0).applyQuaternion(cube.quaternion);

            let speed = 10;
            body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

            if (keysPressed.w) {
                localNegativeXAxis.applyAxisAngle(localXAxis, turningangle);

                // Convert the rotated velocity back to a CANNON.Vec3 and apply it to body.velocity
                body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

                console.log("w");
            }
            if (keysPressed.a) {
                localNegativeXAxis.applyAxisAngle(localYAxis, turningangle);

                // Convert the rotated velocity back to a CANNON.Vec3 and apply it to body.velocity
                body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

                console.log("a");
            }
            if (keysPressed.s) {
                localNegativeXAxis.applyAxisAngle(localXAxis, -turningangle);

                // Convert the rotated velocity back to a CANNON.Vec3 and apply it to body.velocity
                body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

                console.log("s");
            }
            if (keysPressed.d) {
                localNegativeXAxis.applyAxisAngle(localYAxis, -turningangle);

                // Convert the rotated velocity back to a CANNON.Vec3 and apply it to body.velocity
                body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);
                console.log("d");
            }
            if (keysPressed[' ']) {
                // body.velocity.set(0, 0, 0);
                // brake != brake;
                console.log("space");
            }

            let lookAtPoint = new THREE.Vector3();
            lookAtPoint.addVectors(cube.position, body.velocity);

            // Make the cube look at the point
            cube.lookAt(lookAtPoint);

            cube.position.copy(body.position); // Atualizar cubo

            // Calculate direction of movement
            let direction = new THREE.Vector3().subVectors(
                new THREE.Vector3(cube.position.x, cube.position.y, cube.position.z),
                new THREE.Vector3(previousPosition.x, previousPosition.y, previousPosition.z)
            ).normalize();

            // Scale the direction vector
            direction.multiplyScalar(10);

            // Calculate camera position: cube position - direction
            let cameraPosition = new THREE.Vector3(cube.position.x, cube.position.y + 2, cube.position.z).sub(direction);

            // Use GSAP to animate the camera's position
            gsap.to(camera.position, {
                duration: 0.6, // animation duration in seconds
                x: cameraPosition.x,
                y: cameraPosition.y,
                z: cameraPosition.z,
                onUpdate: function () {
                    // Make the camera look at the cube during the animation
                    camera.lookAt(new THREE.Vector3(cube.position.x, cube.position.y, cube.position.z));
                },
                ease: "power1.out" // easing function for the animation
            });

            // Update previous position
            previousPosition.copy(cube.position);

            // ver velocidade
            // Create an arrow to represent the velocity
            let dir = new THREE.Vector3(body.velocity.x, body.velocity.y, body.velocity.z);
            let origin = new THREE.Vector3(body.position.x, body.position.y, body.position.z);
            let length = body.velocity.length();
            let hex = 0xffff00; // Color of the arrow

            let arrowHelper = new THREE.ArrowHelper(dir.normalize(), origin, length, hex);
            // scene.add(arrowHelper);

            // Update the arrow to match the body's velocity
            arrowHelper.position.copy(body.position);
            arrowHelper.setDirection(new THREE.Vector3(body.velocity.x, body.velocity.y, body.velocity.z).normalize());
            arrowHelper.setLength(body.velocity.length());

            world.step(1 / 140); // Step the physics world
        }

        let clock = new THREE.Clock();
        // Animation
        const animate = function () {
            let deltaTime = clock.getDelta();
            requestAnimationFrame(animate);
            controls.update();
            camera.lookAt(cube.position);

            updatePhysics(deltaTime);

            // checkCollisions();

            // for (let i = 0; i < spheres.length; i++) {
            //     const sphere = spheres[i];
            //     const body = shephersBodies[i];

            //     sphere.position.copy(body.position);
            //     sphere.quaternion.copy(body.quaternion);
            // }

            // Remove collided spheres from scene and arrays
            // for (let i of spheresToRemove) {
            //     scene.remove(spheres[i]);
            // }

            renderer.render(scene, camera);
        };

        animate();

        // Clean up on unmount
        return () => {
            controls.dispose();
            mountRef.current.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} />;
};

export default Game;