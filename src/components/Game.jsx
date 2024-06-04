import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { gsap } from 'gsap';
import { Matrix4 } from 'three';
import RAPIER from '@dimforge/rapier3d';
import * as CANNON from 'cannon';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import HdrFile from "../assets/sky2.hdr";
import { CubeTextureLoader } from 'three';
import posx from '../assets/Lycksele2/posx.png';
import negx from '../assets/Lycksele2/negx.png';
import posy from '../assets/Lycksele2/posy.png';
import negy from '../assets/Lycksele2/negy.png';
import posz from '../assets/Lycksele2/posz.png';
import negz from '../assets/Lycksele2/negz.png';
import { useNavigate } from 'react-router-dom';

import { Canvas } from '@react-three/fiber';
import GameOverlay from './GameOverlay';
import { Helmet } from 'react-helmet';



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
    const [score, setScore] = useState(0);
    const [health, setHealth] = useState(3000);
    const delayFrames = 10;
    let speed = 20;
    let speedBoostDuration = 3000; // 3 seconds
    const aiSnakes = []; // Array to hold all AI snakes
    const navigate = useNavigate();

    useEffect(() => {

        // Cannon.js
        // Setup our world
        world = new CANNON.World();
        world.gravity.set(0, 0, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 10;

        // Scene
        const scene = new THREE.Scene();
        const cubeTextureLoader = new CubeTextureLoader();
        const skyboxTexture = cubeTextureLoader.load([
            posx, negx, posy, negy, posz, negz
        ]);
        scene.background = skyboxTexture;
        scene.environment = skyboxTexture;
        // Increase or decrease this value to adjust the exposure

        // Camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.shadowMap.enabled = true;
        renderer.setSize(window.innerWidth, window.innerHeight);
        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspext = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        })
        // OrbitControls
        renderer.toneMappingExposure = 0.3;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.update();

        // lights
        const light = new THREE.DirectionalLight(0xffffff, 1.5);
        light.position.set(-1000, 0, 1000).normalize();
        light.castShadow = true;
        scene.add(light);

        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Axes Helper
        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.position.set(1, 1, 1); // Move the axes helper to the position (1, 1, 1)
        // scene.add(axesHelper);

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
                const sphereGeometry = new THREE.SphereGeometry(1, 12, 12);
                const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
                const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.castShadow = true;
                sphere.receiveShadow = true;

                let sphereBox = new THREE.Sphere(sphere.position, 0.5);
                spheresBox.push(sphereBox);
                // let sphereBoundingBox = new THREE.Box3().setFromObject(sphere);

                const shape = new CANNON.Sphere(new CANNON.Vec3(1 / 2, 12 / 2, 12 / 2));
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

        const cubeGeometry = new THREE.SphereGeometry(1, 32, 32);
        const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        const shape = new CANNON.Sphere(new CANNON.Vec3(1 / 2, 12 / 2, 12 / 2));
        // ele tem uma condicao a definir se cai ou nao
        let mass = 7;
        let body = new CANNON.Body({ mass });
        body.position.copy(cube.position);
        world.addBody(body);

        let cubeBox = new THREE.Sphere(cube.position, 1);

        // Create the body segments
        const bodySegments = [];
        const segmentGeometry = new THREE.SphereGeometry(1, 12, 12);
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
        // scene.add(plane);

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
            }
            if (keysPressed.a) {
                localNegativeXAxis.applyAxisAngle(localYAxis, turningangle);

                setVelocityWithDelay(cubes, localNegativeXAxis, speed);
            }
            if (keysPressed.s) {
                localNegativeXAxis.applyAxisAngle(localXAxis, -turningangle);
                setVelocityWithDelay(cubes, localNegativeXAxis, speed);
                // cubes.forEach(cube => {
                //     // Convert the rotated velocity back to a CANNON.Vec3 and apply it to the cube's body velocity
                //     cube.cannonjs.velocity.set(localNegativeXAxis.x * speed, localNegativeXAxis.y * speed, localNegativeXAxis.z * speed);
                // });
            }
            if (keysPressed.d) {
                localNegativeXAxis.applyAxisAngle(localYAxis, -turningangle);
                setVelocityWithDelay(cubes, localNegativeXAxis, speed);

            }

            let currentSpeed = speed;
            let speedBoostActive = false;
            if (keysPressed[' ']) {
                if (!speedBoostActive && speedBoostDuration > 0) {
                    speedBoostActive = true;
                    onBoost();
                    speedBoostDuration = speedBoostDuration - 100;
                    // console.log("boost: ", speedBoostDuration)
                    currentSpeed = speed * 4; // Set the speed to 4 times the original speed
                }
            } else {
                // Reset the speed boost if the space key is released
                if (speedBoostActive) {
                    speedBoostActive = false;
                    currentSpeed = speed; // Reset the speed to the original value
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

        function createSphere() {
            let geometry = new THREE.SphereGeometry(1, 12, 12);
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
                    // console.log('collision detected');
                    scene.remove(spheres[i]);
                    onSphereCollected();
                    onPlayerDamaged();
                    speedBoostDuration = speedBoostDuration + 1000;

                    // Create a new body segment
                    const segmentGeometry = new THREE.SphereGeometry(1, 12, 12);
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
                    spheresBox.push(new THREE.Sphere(newSphere.position, 1));
                    spheres.splice(i, 1);
                    spheresBox.splice(i, 1);
                }
            }
        }

        function checkCollisionsSankes() {
            let playerHeadBoundingBox = new THREE.Sphere(cube.position, 1);

            // Iterate through the body segments of other snakes
            for (let snake of aiSnakes) {
                // Iterate through the body segments of the current snake
                let snakeaHeadBoundingBox = new THREE.Sphere(snake.body[0].position, 0.5);
                for (let segment of snake.body) {
                    let segmentBoundingBox = new THREE.Sphere(segment.position, 0.5);

                    // Check for collision between player snake's head and current snake's body segment
                    if (playerHeadBoundingBox.intersectsSphere(segmentBoundingBox)) {
                        // console.log('Collision detected snake killed player');
                        // Handle collision here, such as removing the player snake or reducing health
                        removePlayerSnake(navigate);
                        break; // Exit the loop since the collision is detected
                    }
                }

                for (let segment of bodySegments) {
                    let segmentBoundingBox = new THREE.Sphere(segment.position, 0.5);

                    // Check for collision between player snake's head and current snake's body segment
                    if (snakeaHeadBoundingBox.intersectsSphere(segmentBoundingBox)) {
                        // console.log('Collision detected player killed snake');
                        // Handle collision here, such as removing the player snake or reducing health
                        removeSnake(snake);
                        break; // Exit the loop since the collision is detected
                    }
                }

                for (let i = bodySegments.length - 2; i > 4; i--) {
                    // let segmentBoundingBox = new THREE.Box3().setFromObject(bodySegments[i + 1]);
                    if (bodySegments.length > 5) {
                        let segmentBoundingBox = new THREE.Sphere(bodySegments[i].position, 0.5);
                        // Check for collision between player snake's head and current snake's body segment
                        if (playerHeadBoundingBox.intersectsSphere(segmentBoundingBox)) {
                            // console.log('Collision detected player');
                            // Handle collision here, such as removing the player snake or reducing health
                            removePlayerSnake(navigate);
                            break; // Exit the loop since the collision is detected
                        }
                    }
                }
            }
        }

        function removePlayerSnake(navigate) {
            // Remove body segments from the scene
            for (let segment of bodySegments) {
                scene.remove(segment);
            }
            scene.remove(cube);
            // Remove physics body from the world
            world.remove(body);

            // Clear the arrays storing body segments
            // bodySegments = [];x

            // Change the URL to the desired path
            navigate('/');
        }


        function getRandomColor() {
            return new THREE.Color(Math.random(), Math.random(), Math.random());
        }

        function getRandomPosition(range) {
            return new THREE.Vector3(
                (Math.random() - 0.5) * range,
                (Math.random() - 0.5) * range,
                (Math.random() - 0.5) * range
            );
        }

        function createAISnake() {
            const aiColor = getRandomColor(); // Generate a random color

            const aiSnake = {
                body: [], // Initialize the body segments of the AI snake
                direction: new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize(), // Initialize the direction vector
                speed: 0.2, // Speed of the AI snake
                color: aiColor,
                boostDuration: 3000.
            };

            // Initialize the body segments of the AI snake
            const initialPosition = getRandomPosition(50); // You can adjust the range as needed
            const aiGeometry = new THREE.SphereGeometry(1, 12, 12);
            const aiMaterial = new THREE.MeshPhongMaterial({ color: aiColor });

            // Initial body segments
            for (let i = 0; i < 5; i++) {
                const segment = new THREE.Mesh(aiGeometry, aiMaterial);
                segment.position.copy(initialPosition).x -= i; // Offset each segment
                aiSnake.body.push(segment);
                scene.add(segment);
            }

            aiSnakes.push(aiSnake);
        }

        function updateAISnake(aiSnake) {
            // Find the nearest sphere to the AI snake head
            let nearestSphere = null;
            let minDistance = Infinity;
            let objects = [cube, ...spheres];
            let mul = new THREE.Vector3();

            for (let sphere of objects) {
                let distance = aiSnake.body[0].position.distanceTo(sphere.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestSphere = sphere;
                }
            }

            // Add some random variation to the direction
            aiSnake.direction.x += (Math.random() - 0.5) * 0.1;
            aiSnake.direction.y += (Math.random() - 0.5) * 0.1;
            aiSnake.direction.z += (Math.random() - 0.5) * 0.1;
            aiSnake.direction.normalize();

            if (nearestSphere) {
                // Calculate the direction vector towards the nearest sphere
                const directionToSphere = nearestSphere.position.clone().sub(aiSnake.body[0].position).normalize();
                aiSnake.direction.lerp(directionToSphere, 0.1);
            }

            cubes.forEach(cube => {
                const velocity = new THREE.Vector3(cube.cannonjs.velocity.x, cube.cannonjs.velocity.y, cube.cannonjs.velocity.z);
                mul.copy(velocity);
            });

            // Calculate the probability based on the size of the snake
            const sizeFactor = aiSnake.body.length / 20; // Adjust the divisor to control how quickly the probability increases with size
            const probabilityToTargetPlayer = Math.min(sizeFactor, 1); // Cap the probability at 1 (100%)

            // Determine if the AI snake will go after the player
            if (Math.random() < probabilityToTargetPlayer) {
                // Predict the player's future position
                const predictionTime = 1; // Adjust as needed
                const predictedPlayerPosition = cube.position.clone().add(mul.multiplyScalar(predictionTime));

                // Calculate direction towards predicted position
                const directionToPlayer = predictedPlayerPosition.clone().sub(aiSnake.body[0].position).normalize();

                // Adjust AI snake's movement to intercept player
                aiSnake.direction.lerp(directionToPlayer, 0.1).normalize();

                console.log("player found");
            }

            // Move the AI snake's body segments
            for (let i = aiSnake.body.length - 1; i > 0; i--) {
                aiSnake.body[i].position.copy(aiSnake.body[i - 1].position);
            }
            aiSnake.body[0].position.add(aiSnake.direction.clone().multiplyScalar(aiSnake.speed));
        }


        // colisions bwtween ai snakes and spheres
        function checkCollisionsAISnake(aiSnake) {
            let aiHeadBoundingBox = new THREE.Box3().setFromObject(aiSnake.body[0]);
            for (let i = spheres.length - 1; i >= 0; i--) {
                let sphere = spheres[i];
                let sphereBoundingBox = new THREE.Box3().setFromObject(sphere);
                if (aiHeadBoundingBox.intersectsBox(sphereBoundingBox)) {
                    // console.log('AI snake collision with sphere detected');
                    scene.remove(sphere);
                    // Create a new body segment
                    const aiGeometry = new THREE.SphereGeometry(1, 12, 12);
                    const aiMaterial = new THREE.MeshPhongMaterial({ color: aiSnake.color });
                    const newSegment = new THREE.Mesh(aiGeometry, aiMaterial);
                    const lastSegment = aiSnake.body[aiSnake.body.length - 1];
                    newSegment.position.copy(lastSegment.position);
                    scene.add(newSegment);
                    aiSnake.body.push(newSegment);
                    // Create a new sphere
                    let newSphere = createSphere();
                    scene.add(newSphere);
                    // Update spheres array
                    // spheres.push(newSphere);
                    // spheres.splice(i, 1); // Remove the collided sphere
                    // Update spheres and bounding boxes
                    spheres.push(newSphere);
                    spheresBox.push(new THREE.Sphere(newSphere.position, 1));
                    spheres.splice(i, 1);
                    spheresBox.splice(i, 1);
                }
            }
        }

        for (let i = 0; i < 3; i++) { // Change the number to create more AI snakes
            createAISnake();
        }

        function checkSnakeCollisions() {
            const allSnakes = aiSnakes;

            for (let i = 0; i < allSnakes.length; i++) {
                let snake1 = allSnakes[i];

                let headBoundingBox = new THREE.Box3().setFromObject(snake1.body[0]);

                for (let j = 0; j < allSnakes.length; j++) {
                    if (i === j) continue;

                    let snake2 = allSnakes[j];
                    for (let k = 1; k < snake2.body.length; k++) {
                        let segmentBoundingBox = new THREE.Box3().setFromObject(snake2.body[k]);

                        if (headBoundingBox.intersectsBox(segmentBoundingBox)) {
                            // console.log(`Collision detected between snake ${i} and snake ${j}`);
                            removeSnake(snake1);

                            i--;
                            break;
                        }
                    }
                }
            }
        }

        function generateSpheresAroundPosition(position, count) {
            for (let i = 0; i < count; i++) {
                const sphereGeometry = new THREE.SphereGeometry(1, 12, 12);
                const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
                const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.castShadow = true;
                sphere.receiveShadow = true;

                let sphereBox = new THREE.Sphere(sphere.position, 0.5);
                spheresBox.push(sphereBox);

                // Randomize the position around the eliminated snake's position
                const offsetX = Math.random() * 10 - 5;
                const offsetY = Math.random() * 10 - 5;
                const offsetZ = Math.random() * 10 - 5;

                sphere.position.copy(position);
                sphere.position.x += offsetX;
                sphere.position.y += offsetY;
                sphere.position.z += offsetZ;

                scene.add(sphere);
                spheres.push(sphere);
            }
        }

        function removeSnake(snake) {
            generateSpheresAroundPosition(snake.body[0].position, snake.body.length);
            snake.body.forEach(segment => scene.remove(segment)); // Remove segments from the scene
            // snake.controls.forEach(control => world.remo ve(control)); // Remove segments from the physics world

            const index = aiSnakes.indexOf(snake);
            if (index > -1) {
                aiSnakes.splice(index, 1); // Remove the snake from the array
            }
        }

        let clock = new THREE.Clock();
        // Animation
        const animate = function () {

            // Previous position of the cube

            let deltaTime = clock.getDelta();

            if (cubes.length > 0) {
                camera.lookAt(cubes[0].threejs.position);
            }

            // updateAISnake();
            checkCollisions();
            updatePhysics(deltaTime);

            // Check for collisions between the AI snake and other objects
            // checkCollisionsAISnake();

            if (aiSnakes.length < 3) {
                createAISnake();
            }

            aiSnakes.forEach(aiSnake => {
                updateAISnake(aiSnake); // Update the AI snake's movement
                checkCollisionsAISnake(aiSnake); // Check for collisions for the AI snake
            });

            checkCollisionsSankes();
            checkSnakeCollisions(); // Check for collisions between snakes
            // checkCollisionsSnake(playerSnake); // Check for collisions for the player snake


            // console.log("ai snake?: ", aiSnakes.length);
            // Update player and AI snakes positions
            // updatePlayerPosition(cube);
            // aiSnakes.forEach(updateAISnakePosition);

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
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        };

        const onSphereCollected = () => {
            setScore(prevScore => prevScore + 10);
        };

        const onPlayerDamaged = () => {
            setHealth(health => health + 1000);
        };

        const onBoost = () => {
            setHealth(health => health - 100);
        };

        const getHealth = () => {
            return health;
        };
        animate();
        // Clean up on unmount
        return () => {
            controls.dispose();
            mountRef.current.removeChild(renderer.domElement);
        };
    }, []);

    // return <div ref={mountRef} />;

    return (
        <div style={{ position: 'relative' }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            {/* <GameOverlay score={score} speedBoostDuration={health} /> */}
            <GameOverlay
                score={score}
                speedBoostDuration={health}
            />
        </div>
    );
};


export default Game;