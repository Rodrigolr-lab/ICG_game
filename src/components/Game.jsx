import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Game = () => {
    const mountRef = useRef(null);

    useEffect(() => {
        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87ceeb);

        // Camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;

        // OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();

        // lights
        const light = new THREE.PointLight(0xffffff, 1);
        light.position.set(0, 10, 10).normalize();
        light.castShadow = true;
        scene.add(light);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Axes Helper
        // const axesHelper = new THREE.AxesHelper(5);
        // axesHelper.position.set(1, 1, 1); // Move the axes helper to the position (1, 1, 1)
        // scene.add(axesHelper);

        // The X-axis is red.
        // The Y-axis is green.
        // The Z-axis is blue.

        // Mount using ref
        mountRef.current.appendChild(renderer.domElement);

        const spheres = [];
        const spheresBox = [];
        // Generate random spheres
        for (let i = 0; i < 100; i++) {
            const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
            const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

            let sphereBox = new THREE.Sphere(sphere.position, 0.5);
            spheresBox.push(sphereBox);

            // Set the position to a random value
            sphere.position.x = Math.random() * 20 - 10;
            sphere.position.y = Math.random() * 20 - 10;
            sphere.position.z = Math.random() * 20 - 10;

            scene.add(sphere);
            spheres.push(sphere);
        }

        // Create a cube
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);

        // Get the bounding box of the cube
        let cubeBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        cubeBox.setFromObject(cube);
        console.log(cubeBox);

        // const planeGeometry = new THREE.PlaneGeometry(10, 10);
        // const planeMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
        // const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        // plane.receiveShadow = true;
        // scene.add(plane);

        // Handle keyboard controls
        const velocity = new THREE.Vector3(0, 0, 0);
        function handleKeyDown(event) {
            const speed = 0.05;
            let direction = new THREE.Vector3();
            switch (event.code) {
                // cube movement
                case 'KeyW':
                    direction.set(0, speed, 0);
                    break;
                case 'KeyS':
                    direction.set(0, -speed, 0);
                    break;
                case 'KeyA':
                    direction.set(-speed, 0, 0);
                    break;
                case 'KeyD':
                    direction.set(speed, 0, 0);
                    break;
                case 'Space':
                    direction.set(0, 0, 0);
                    break;
            }
            // Transform the direction of movement from the camera's local space to world space
            camera.localToWorld(direction);
            // Subtract the camera's position to get the direction relative to the world origin
            direction.sub(camera.position);
            // Apply the direction to the cube's velocity
            velocity.copy(direction);
        }
        window.addEventListener('keydown', handleKeyDown);


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
        // Animation
        const animate = function () {
            requestAnimationFrame(animate);
            controls.update();

            // Update camera position to follow the cube
            // camera.position.x = cube.position.x;
            // camera.position.y = cube.position.y + 2;
            // camera.position.z = cube.position.z + 8; // Offset the camera a bit on the z axis

            // Apply velocity to cube's position
            cube.position.add(velocity);
            cubeBox.copy(cube.geometry.boundingBox).applyMatrix4(cube.matrixWorld);

            // follow cube
            // camera.lookAt(cube.position);
            checkCollisions();
            // Remove collided spheres from scene and arrays
            // for (let i of spheresToRemove) {
            //     scene.remove(spheres[i]);
            // }

            renderer.render(scene, camera);
        };

        animate();
        // Clean up on unmount
        return () => {
            mountRef.current.removeChild(renderer.domElement);
        };
    }, []);

    return <div ref={mountRef} />;
};

export default Game;