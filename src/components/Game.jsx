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
    const delayFrames = 10;
    let speed = 10;
    let speedBoostActive = false;
    let speedBoostTimer = null;
    const speedBoostDuration = 3000; // 3 seconds

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
            for (let i = 0; i < 200; i++) {
                const sphereGeometry = new THREE.SphereGeometry(0.5, 12, 12);
                const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.castShadow = true;
                sphere.receiveShadow = true;

                let sphereBox = new THREE.Sphere(sphere.position, 0.5);
                spheresBox.push(sphereBox);
                // let sphereBoundingBox = new THREE.Box3().setFromObject(sphere);

                const shape = new CANNON.Sphere(new CANNON.Vec3(0.5 / 2, 12 / 2, 12 / 2));
                // ele tem uma condicao a definir se cai ou nao
                let mass = 1;
                let bodyspheres = new CANNON.Body({ mass });
                bodyspheres.position.set(Math.random() * 20 - 10, Math.random() * 20 - 10, Math.random() * 20 - 10);
                world.addBody(bodyspheres);
                shephersBodies.push(bodyspheres);

                // Set the position to a random value
                sphere.position.x = Math.random() * 100 - 50;
                sphere.position.y = Math.random() * 100 - 50;
                sphere.position.z = Math.random() * 100 - 50;

                scene.add(sphere);
                spheres.push(sphere);
            }

            return { spheres, spheresBox, shephersBodies };
        }

        let { spheres, spheresBox, shephersBodies } = generateSpheres(scene);
        let cubes = []
        let positions = [];

        const cubeGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        const shape = new CANNON.Sphere(new CANNON.Vec3(0.5 / 2, 12 / 2, 12 / 2));
        // ele tem uma condicao a definir se cai ou nao
        let mass = 7;
        let body = new CANNON.Body({ mass });
        body.position.copy(cube.position);
        world.addBody(body);

        // let cubeBox = new THREE.Box3().setFromObject(cube);
        let cubeBox = new THREE.Sphere(cube.position, 0.5);
        // cubeBox.setFromObject(cube);

        // Create the body segments
        const bodySegments = [];
        const segmentGeometry = new THREE.SphereGeometry(0.5, 12, 12);
        const segmentMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

        // Initial body segments
        for (let i = 0; i < 5; i++) {
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.position.x = -i;
            bodySegments.push(segment);
            scene.add(segment);
        }

        let axesHelpercube = new THREE.AxesHelper(1);
        // Add it as a child of the cube
        // cube.add(axesHelpercube);
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
        let turningangle = 0.025;

        // Function to set the velocity with a delay
        async function setVelocityWithDelay(cubes, localNegativeXAxis, speed) {
            const delayBetweenCubes = 1000 / 60 * delayFrames; // 60 frames delay in milliseconds (1000ms/60fps * 60)

            let lookAtPoint = new THREE.Vector3();
            // console.log("------ update the velocity of the cubes with a delay setVelocityWithDelay;");
            for (let i = 0; i < cubes.length; i++) {
                // Set the velocity for the current cube
                cubes[i].cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);

                lookAtPoint.addVectors(cubes[i].threejs.position, cubes[i].cannonjs.velocity);

                // Make the cube look at the point
                cubes[i].threejs.lookAt(lookAtPoint);

                // If it's not the last cube, wait for the delay before continuing to the next cube
                if (i < cubes.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenCubes));
                }
            }

            for (let i = cubes.length - 1; i > 0; i--) {
                let targetIndex = positions.length - (i + delayFrames); // Adjust the delay factor (e.g., 10 frames)

                if (targetIndex >= 0) {
                    cubes[i].threejs.position.copy(positions[targetIndex]);
                    cubes[i].cannonjs.position.copy(positions[targetIndex]);
                }
            }
        }

        let direction = new THREE.Vector3();

        function updatePhysics() {
            // console.log(body.velocity.x, body.velocity.y, body.velocity.z);
            cubes[0].cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);
            cubes[0].threejs.position.copy(cubes[0].cannonjs.position);

            // define the cubes X axis
            let localXAxis = new THREE.Vector3(2, 0, 0).applyQuaternion(cube.quaternion);
            //  define the cubes Y axis
            let localYAxis = new THREE.Vector3(0, 2, 0).applyQuaternion(cube.quaternion);

            setVelocityWithDelay(cubes, localNegativeXAxis, speed);

            if (keysPressed.w) {
                localNegativeXAxis.applyAxisAngle(localXAxis, turningangle);

                setVelocityWithDelay(cubes, localNegativeXAxis, speed);


                // console.log("w");
            }
            if (keysPressed.a) {
                localNegativeXAxis.applyAxisAngle(localYAxis, turningangle);

                setVelocityWithDelay(cubes, localNegativeXAxis, speed);

                // console.log("a");
            }
            if (keysPressed.s) {
                localNegativeXAxis.applyAxisAngle(localXAxis, -turningangle);

                cubes.forEach(cube => {
                    // Convert the rotated velocity back to a CANNON.Vec3 and apply it to the cube's body velocity
                    cube.cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);
                });

                // console.log("s");
            }
            if (keysPressed.d) {
                localNegativeXAxis.applyAxisAngle(localYAxis, -turningangle);

                setVelocityWithDelay(cubes, localNegativeXAxis, speed);

                // console.log("d");
            }

            let currentSpeed = speed;

            if (keysPressed[' ']) {
                if (!speedBoostActive) {
                    speedBoostActive = true;
                    currentSpeed *= 4; // Multiply the speed by 4

                    // Start the speed boost timer
                    speedBoostTimer = setTimeout(() => {
                        speedBoostActive = false;
                        currentSpeed = speed; // Reset the speed to the original value
                    }, speedBoostDuration);
                }
            } else {
                // Reset the speed boost if the space key is released
                if (speedBoostActive) {
                    clearTimeout(speedBoostTimer);
                    speedBoostActive = false;
                    currentSpeed = speed;
                }
            }
            setVelocityWithDelay(cubes, localNegativeXAxis, currentSpeed);

            cubes.forEach(cube => {
                let lookAtPoint = new THREE.Vector3();
                lookAtPoint.addVectors(cube.threejs.position, cube.cannonjs.velocity);

                // Make the cube look at the point
                cube.threejs.lookAt(lookAtPoint);
            });

            direction = new THREE.Vector3().subVectors(
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

        function createCube() {
            let highResGeometry = new THREE.SphereGeometry(0.5, 32, 32);
            let lowResGeometry = new THREE.SphereGeometry(0.5, 12, 12);
            let material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
            let newCube = new THREE.Mesh(lowResGeometry, material);

            if (!newCube) {
                console.error('Failed to create new cube');
                return;
            }

            const shape = new CANNON.Sphere(new CANNON.Vec3(0.5 / 2, 32 / 2, 32 / 2));
            let mass = 7;
            let newbody = new CANNON.Body({ mass });

            // Position the new cube correctly based on the existing cubes
            let lastCube = cubes[cubes.length - 1];
            if (lastCube) {
                // Calculate the direction vector from the second-to-last cube to the last cube
                const directionVector = cubes.length > 1
                    ? new THREE.Vector3().subVectors(lastCube.threejs.position, cubes[cubes.length - 2].threejs.position).normalize()
                    : new THREE.Vector3(0, 0, -1); // Default direction if there's only one cube

                // Set the position of the new cube based on the direction vector and a fixed distance
                const distance = 1; // Adjust this value to control the distance between cubes
                newCube.position.copy(lastCube.threejs.position).add(directionVector.multiplyScalar(distance));
            } else {
                // Initial position for the very first cube
                newCube.position.set(0, 0, 0);
            }

            newbody.position.copy(newCube.position);

            world.addBody(newbody);
            let newcubeBox = new THREE.Sphere(newCube.position, 0.5);

            if (newCube && scene) {
                scene.add(newCube);
            } else {
                console.error('Failed to add new cube to the scene');
            }

            cubes.push({
                threejs: newCube,
                cannonjs: newbody,
                box: newcubeBox,
                previousPositions: [] // Array to store previous positions
            });

            console.log(cubes.length + "cubes length");
            return newCube;
        }

        function createSphere() {
            let geometry = new THREE.SphereGeometry(0.5, 12, 12);
            let material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            let newSphere = new THREE.Mesh(geometry, material);

            newSphere.castShadow = true;
            newSphere.receiveShadow = true;
            // Set the position of the new sphere to be a random position within the scene
            newSphere.position.set(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50);

            return newSphere;
        };

        // Adjusted checkCollisions function to handle collisions properly
        function checkCollisions() {
            let cubeBoundingBox = new THREE.Box3().setFromObject(cube);

            for (let i = spheresBox.length - 1; i >= 0; i--) {
                let sphereBox = spheresBox[i];

                if (cubeBoundingBox.intersectsSphere(sphereBox)) {
                    console.log('collision detected');
                    scene.remove(spheres[i]);

                    // Create a new body segment
                    const segmentGeometry = new THREE.SphereGeometry(0.5, 12, 12);
                    const segmentMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
                    const newSegment = new THREE.Mesh(segmentGeometry, segmentMaterial);

                    // Position the new segment at the end of the snake
                    const lastSegment = bodySegments[bodySegments.length - 1];
                    if (lastSegment) {
                        newSegment.position.copy(lastSegment.position);
                        newSegment.position.sub(direction.divideScalar(10));
                    } else {
                        newSegment.position.copy(cube.position);
                        newSegment.position.sub(direction.divideScalar(10));
                    }

                    // Add the new segment to the scene and the bodySegments array
                    scene.add(newSegment);
                    bodySegments.push(newSegment);

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

            // Previous position of the cube

            let deltaTime = clock.getDelta();
            requestAnimationFrame(animate);

            if (cubes.length > 0) {
                camera.lookAt(cubes[0].threejs.position);
            }

            checkCollisions();

            updatePhysics(deltaTime);

            // Update the body segments' positions
            for (let i = bodySegments.length - 1; i > 0; i--) {
                bodySegments[i].position.copy(bodySegments[i - 1].position);
            }
            direction.divideScalar(10);
            if (bodySegments.length > 0) {
                bodySegments[0].position.copy(cube.position);
                bodySegments[0].position.sub(direction);
            }

            // Add the current position of the first cube to the positions array
            if (cubes.length > 0) {
                positions.push(cubes[0].threejs.position.clone());
            }

            // If the positions array has more than 60 positions, remove the oldest one
            let MaxElements = cubes.length * delayFrames;
            if (positions.length > MaxElements) {
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