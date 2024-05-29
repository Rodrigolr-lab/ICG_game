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
                let sphereBox = new THREE.Sphere(sphere.position, 0.5);
                spheresBox.push(sphereBox);
                // let sphereBoundingBox = new THREE.Box3().setFromObject(sphere);

                const shape = new CANNON.Sphere(new CANNON.Vec3(0.5 / 2, 32 / 2, 32 / 2));
                // ele tem uma condicao a definir se cai ou nao
                let mass = 1;
                let bodyspheres = new CANNON.Body({ mass });
                bodyspheres.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
                world.addBody(bodyspheres);
                shephersBodies.push(bodyspheres);

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
        let cubes = []
        let positions = [];

        // Create a cube
        const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
        const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        const shape = new CANNON.Box(new CANNON.Vec3(1 / 2, 1 / 2, 1 / 2));
        // ele tem uma condicao a definir se cai ou nao
        let mass = 7;
        let body = new CANNON.Body({ mass });
        body.position.copy(cube.position);
        world.addBody(body);
        // let cubeBox = new THREE.Box3().setFromObject(cube);
        let cubeBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
        cubeBox.setFromObject(cube);

        let axesHelpercube = new THREE.AxesHelper(1);
        // Add it as a child of the cube
        cube.add(axesHelpercube);
        cube.receiveShadow = true;
        scene.add(cube);

        cubes.push({
            threejs: cube,
            cannonjs: body,
            box: cubeBox,
            axesHelper: axesHelpercube,
            previousPosition: new CANNON.Vec3().copy(cube.position)// Add this line
        });

        // Create a plane
        const planeGeometry = new THREE.PlaneGeometry(100, 100);
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

        // Previous position of the cube
        let previousPositionx = new CANNON.Vec3().copy(cube.position);

        // velocidaded incial
        let localNegativeXAxis = new THREE.Vector3(0, 0, -2).applyQuaternion(cube.quaternion);
        // angulo de rotacao
        let turningangle = 0.05;

        // Function to set the velocity with a delay
        async function setVelocityWithDelay(cubes, localNegativeXAxis, speed) {
            const delayBetweenCubes = 1000 / 60 * 60; // 60 frames delay in milliseconds (1000ms/60fps * 60)

            for (let i = 0; i < cubes.length; i++) {
                // Set the velocity for the current cube
                cubes[i].cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

                // If it's not the last cube, wait for the delay before continuing to the next cube
                if (i < cubes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenCubes));
                }
            }
        }

        function updatePhysics() {
            // console.log(body.velocity.x, body.velocity.y, body.velocity.z);

            // define the cubes X axis
            let localXAxis = new THREE.Vector3(2, 0, 0).applyQuaternion(cube.quaternion);
            //  define the cubes Y axis
            let localYAxis = new THREE.Vector3(0, 2, 0).applyQuaternion(cube.quaternion);

            let speed = 10;
            // body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

            // cubes.forEach(cube => {
            //     // Convert the rotated velocity back to a CANNON.Vec3 and apply it to the cube's body velocity
            //     cube.cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);
            // });

            setVelocityWithDelay(cubes, localNegativeXAxis, speed);


            if (keysPressed.w) {
                localNegativeXAxis.applyAxisAngle(localXAxis, turningangle);

                // Convert the rotated velocity back to a CANNON.Vec3 and apply it to body.velocity
                // body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

                // cubes.forEach(cube => {
                //     // Convert the rotated velocity back to a CANNON.Vec3 and apply it to the cube's body velocity
                //     cube.cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);
                // });
                setVelocityWithDelay(cubes, localNegativeXAxis, speed);


                console.log("w");
            }
            if (keysPressed.a) {
                localNegativeXAxis.applyAxisAngle(localYAxis, turningangle);

                // Convert the rotated velocity back to a CANNON.Vec3 and apply it to body.velocity
                // body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

                // cubes.forEach(cube => {
                //     // Convert the rotated velocity back to a CANNON.Vec3 and apply it to the cube's body velocity
                //     cube.cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);
                // });
                setVelocityWithDelay(cubes, localNegativeXAxis, speed);

                console.log("a");
            }
            if (keysPressed.s) {
                localNegativeXAxis.applyAxisAngle(localXAxis, -turningangle);

                // Convert the rotated velocity back to a CANNON.Vec3 and apply it to body.velocity
                // body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

                cubes.forEach(cube => {
                    // Convert the rotated velocity back to a CANNON.Vec3 and apply it to the cube's body velocity
                    cube.cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);
                });

                console.log("s");
            }
            if (keysPressed.d) {
                localNegativeXAxis.applyAxisAngle(localYAxis, -turningangle);

                // Convert the rotated velocity back to a CANNON.Vec3 and apply it to body.velocity
                // body.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

                // cubes.forEach(cube => {
                //     // Convert the rotated velocity back to a CANNON.Vec3 and apply it to the cube's body velocity
                //     cube.cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);
                // });
                setVelocityWithDelay(cubes, localNegativeXAxis, speed);

                console.log("d");
            }
            if (keysPressed[' ']) {
                // body.velocity.set(0, 0, 0);
                // brake != brake;
                console.log("space");
            }

            cubes.forEach(cube => {
                let lookAtPoint = new THREE.Vector3();
                lookAtPoint.addVectors(cube.threejs.position, cube.cannonjs.velocity);

                // Make the cube look at the point
                cube.threejs.lookAt(lookAtPoint);
            });

            // Update positions of the cubes to follow the previous one
            for (let i = cubes.length - 1; i > 0; i--) {
                cubes[i].threejs.position.copy(cubes[i - 1].threejs.position);
                cubes[i].cannonjs.position.copy(cubes[i - 1].cannonjs.position);
            }

            cube.position.copy(body.position); // Atualizar cubo
            cubes.forEach(cube => {
                cube.threejs.position.copy(cube.cannonjs.position);
            });

            // Calculate direction of movement
            let direction = new THREE.Vector3().subVectors(
                new THREE.Vector3(cube.position.x, cube.position.y, cube.position.z),
                new THREE.Vector3(previousPositionx.x, previousPositionx.y, previousPositionx.z)
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
            previousPositionx.copy(cube.position);

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

        // Function to handle the creation of a new cube
        function createCube() {
            let geometry = new THREE.BoxGeometry(1, 1, 1);
            let material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            let newCube = new THREE.Mesh(geometry, material);
            const shape = new CANNON.Box(new CANNON.Vec3(1 / 2, 1 / 2, 1 / 2));
            let mass = 7;
            let newbody = new CANNON.Body({ mass });

            // Get the last cube in the array
            let lastCube = cubes[cubes.length - 1];
            if (lastCube) {
                newCube.position.set(lastCube.threejs.position.x, lastCube.threejs.position.y, lastCube.threejs.position.z - 1);
            } else if (positions.length === 60) {
                console.log('positions.length === 60');
                newCube.position.copy(positions[0]);
            }
            newbody.position.copy(newCube.position);

            world.addBody(newbody);
            let newcubeBox = new THREE.Box3(new THREE.Vector3(), new THREE.Vector3());
            newcubeBox.setFromObject(newCube);

            cubes.push({
                threejs: newCube,
                cannonjs: newbody,
                box: newcubeBox,
                previousPosition: lastCube ? lastCube.threejs.position.clone() : new THREE.Vector3()
            });
            console.log(cubes.length);
            return newCube;
        };


        function createSphere() {
            let geometry = new THREE.SphereGeometry(0.5, 32, 32);
            let material = new THREE.MeshPhongMaterial({ color: 0xff000 });
            let newSphere = new THREE.Mesh(geometry, material);

            newSphere.castShadow = true;
            newSphere.receiveShadow = true;
            // Set the position of the new sphere to be a random position within the scene
            newSphere.position.set(Math.random() * 10 - 5, Math.random() * 10 - 5, Math.random() * 10 - 5);

            return newSphere;
        };

        // Function to handle collision detection
        function checkCollisions() {
            let cubeBoundingBox = new THREE.Box3().setFromObject(cube);

            for (let i = spheresBox.length - 1; i >= 0; i--) {
                let sphereBox = spheresBox[i];

                if (cubeBoundingBox.intersectsSphere(sphereBox)) {
                    console.log('collision detected');
                    scene.remove(spheres[i]);

                    // Create a new cube and sphere
                    let newCube = createCube();
                    scene.add(newCube);
                    let newSphere = createSphere();
                    scene.add(newSphere);

                    // Update spheres and bounding boxes
                    spheres.push(newSphere);
                    spheresBox.push(new THREE.Sphere(newSphere.position, 0.5));
                    spheres.splice(i, 1);
                    spheresBox.splice(i, 1);
                }
            }
        }

        let clock = new THREE.Clock();
        // Animation
        const animate = function () {
            let deltaTime = clock.getDelta();
            requestAnimationFrame(animate);
            controls.update();
            if (cubes.length > 0) {
                camera.lookAt(cubes[0].threejs.position);
            }

            checkCollisions();

            // Update the positions of the cubes with a delay
            for (let i = cubes.length - 1; i > 0; i--) {
                let targetIndex = positions.length - (i + 1) * 10; // Adjust the delay factor (e.g., 10 frames)
                if (targetIndex >= 0) {
                    cubes[i].threejs.position.copy(positions[targetIndex]);
                    cubes[i].cannonjs.position.copy(positions[targetIndex]);
                }
            }
            updatePhysics(deltaTime);

            // Add the current position of the first cube to the positions array
            if (cubes.length > 0) {
                positions.push(cubes[0].threejs.position.clone());
            }

            // If the positions array has more than 60 positions, remove the oldest one
            if (positions.length > 600) {
                positions.shift();
            }

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