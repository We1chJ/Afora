import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Background3D = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Scene setup
        const scene = new THREE.Scene();
        
        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            50, // Reduced FOV for better depth
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.z = 15;

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // Particles setup
        const particles = new THREE.BufferGeometry();
        const particleCount = 300; // Increased particle count
        const posArray = new Float32Array(particleCount * 3);
        const speedArray = new Float32Array(particleCount);

        for (let i = 0; i < particleCount * 3; i += 3) {
            // Create a sphere of particles
            const radius = 10;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            posArray[i] = radius * Math.sin(phi) * Math.cos(theta);
            posArray[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            posArray[i + 2] = radius * Math.cos(phi);
            
            // Random speed for each particle
            speedArray[i / 3] = Math.random() * 0.02 + 0.01;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        // Material setup
        const material = new THREE.PointsMaterial({
            size: 0.1,
            sizeAttenuation: true,
            color: '#6366f1',
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });

        // Create point cloud
        const pointCloud = new THREE.Points(particles, material);
        scene.add(pointCloud);

        // Mouse interaction
        let mouseX = 0;
        let mouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX - windowHalfX) * 0.0003;
            mouseY = (event.clientY - windowHalfY) * 0.0003;
        };

        document.addEventListener('mousemove', handleMouseMove);

        // Animation
        let frame = 0;
        const animate = () => {
            frame = requestAnimationFrame(animate);

            // Rotate based on mouse position
            pointCloud.rotation.x += mouseY * 0.5;
            pointCloud.rotation.y += mouseX * 0.5;

            // Gentle continuous rotation
            pointCloud.rotation.y += 0.001;

            // Update particle positions
            const positions = particles.attributes.position.array as Float32Array;
            for (let i = 0; i < particleCount * 3; i += 3) {
                const speed = speedArray[i / 3];
                positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * speed;
            }
            particles.attributes.position.needsUpdate = true;

            renderer.render(scene, camera);
        };

        // Handle window resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);
        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(frame);
            container?.removeChild(renderer.domElement);
            scene.remove(pointCloud);
            particles.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div 
            ref={containerRef} 
            className="fixed inset-0 -z-10 pointer-events-none"
            style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(168, 85, 247, 0.05) 100%)',
            }}
        />
    );
};

export default Background3D; 