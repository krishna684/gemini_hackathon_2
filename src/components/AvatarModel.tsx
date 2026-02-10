'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

interface AvatarModelProps {
    expression: 'neutral' | 'happy' | 'thinking' | 'concerned' | 'excited';
    gesture: 'idle' | 'greeting' | 'explaining' | 'pointing';
    isSpeaking: boolean;
    speechEnergy?: number;
}

type MorphMesh = THREE.Mesh & {
    morphTargetDictionary?: { [key: string]: number };
    morphTargetInfluences?: number[];
};

type MorphTargetMap = {
    [name: string]: number;
};

type RigBone = {
    bone: THREE.Bone;
    rest: THREE.Quaternion;
};

type ArmRig = {
    upper?: RigBone;
    lower?: RigBone;
    hand?: RigBone;
};

type AvatarRig = {
    head?: RigBone;
    neck?: RigBone;
    spine?: RigBone;
    chest?: RigBone;
    left: ArmRig;
    right: ArmRig;
};

const RPM_AVATAR_URL =
    process.env.NEXT_PUBLIC_RPM_AVATAR_URL ||
    '/avatars/6986dfdd47a75ab0c820deb2.glb';
const RPM_MORPH_TARGETS = process.env.NEXT_PUBLIC_RPM_MORPH_TARGETS || 'ARKit';

const _tmpEuler = new THREE.Euler();
const _tmpQuat = new THREE.Quaternion();
const _targetQuat = new THREE.Quaternion();

export default function AvatarModel({ expression, gesture, isSpeaking, speechEnergy }: AvatarModelProps) {
    const groupRef = useRef<THREE.Group>(null);
    const mixerRef = useRef<THREE.AnimationMixer | null>(null);
    const animationActionsRef = useRef<THREE.AnimationAction[]>([]);
    const rigRef = useRef<AvatarRig | null>(null);
    const speechEnergyRef = useRef(0);
    const visemePhaseRef = useRef(Math.random() * Math.PI * 2);
    const avatarUrl = useMemo(() => buildAvatarUrl(RPM_AVATAR_URL), []);
    const gltf = useLoader(GLTFLoader, avatarUrl);

    const morphMeshes = useMemo<MorphMesh[]>(() => {
        if (!gltf?.scene) return [];
        const meshes: MorphMesh[] = [];
        gltf.scene.traverse((child) => {
            const mesh = child as MorphMesh;
            if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
                meshes.push(mesh);
            }
        });
        return meshes;
    }, [gltf]);

    useEffect(() => {
        if (!gltf?.scene) return;
        rigRef.current = buildAvatarRig(gltf.scene);
    }, [gltf]);

    useEffect(() => {
        if (!gltf?.scene || !gltf?.animations?.length) return;
        const mixer = new THREE.AnimationMixer(gltf.scene);
        mixerRef.current = mixer;

        const idleLikeClips = gltf.animations.filter((clip) =>
            /(idle|breath|breathe|standing|talk|listen)/i.test(clip.name || '')
        );

        animationActionsRef.current = idleLikeClips.map((clip) => {
            const action = mixer.clipAction(clip);
            action.play();
            action.setEffectiveWeight(0.22);
            return action;
        });

        return () => {
            animationActionsRef.current.forEach((action) => action.stop());
            mixer.stopAllAction();
            mixerRef.current = null;
        };
    }, [gltf]);

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        if (mixerRef.current) mixerRef.current.update(delta);

        const t = state.clock.elapsedTime;
        const targetEnergy = typeof speechEnergy === 'number' ? THREE.MathUtils.clamp(speechEnergy, 0, 1) : (isSpeaking ? 1 : 0);
        speechEnergyRef.current = THREE.MathUtils.damp(
            speechEnergyRef.current,
            targetEnergy,
            6,
            delta
        );
        const speechEnergyValue = speechEnergyRef.current;
        const effectiveGesture = gesture === 'idle' && speechEnergyValue > 0.35 ? 'explaining' : gesture;

        visemePhaseRef.current += delta * (6 + speechEnergyValue * 9);

        const breathe = 1 + 0.01 * Math.sin(t * 1.6);
        groupRef.current.scale.set(1, breathe, 1);

        applyHeadAndTorsoMotion(groupRef.current, effectiveGesture, t, speechEnergyValue);
        applyRigGesture(rigRef.current, effectiveGesture, t, speechEnergyValue);
        applyExpressionMorphs(morphMeshes, expression, t, speechEnergyValue);
        applyLipSync(morphMeshes, speechEnergyValue, visemePhaseRef.current, t);
    });

    useEffect(() => {
        if (groupRef.current) {
            groupRef.current.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    const mesh = child as THREE.Mesh;
                    mesh.frustumCulled = false;
                    mesh.renderOrder = 0; // Default render order

                    if (mesh.material) {
                        const mat = mesh.material as THREE.MeshStandardMaterial;
                        mat.transparent = false; // Force opaque
                        mat.opacity = 1.0;
                        mat.depthWrite = true;
                        mat.depthTest = true;
                        mat.side = THREE.FrontSide;
                        mat.color.setHex(0xffffff); // Reset color to white (modulate texture)
                        mat.needsUpdate = true;
                    }
                }
            });
        }
    }, [gltf]);

    return (
        <group ref={groupRef}>
            <primitive object={gltf.scene} position={[0, -0.9, 0]} scale={1.2} />
        </group>
    );
}

function buildAvatarUrl(url: string): string {
    if (typeof window === 'undefined') return url;
    try {
        const absolute = url.startsWith('http')
            ? url
            : `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
        const parsed = new URL(absolute);
        if (!parsed.searchParams.has('morphTargets')) {
            parsed.searchParams.set('morphTargets', RPM_MORPH_TARGETS);
        }
        return parsed.toString();
    } catch {
        return url;
    }
}

function applyHeadAndTorsoMotion(
    group: THREE.Group,
    gesture: AvatarModelProps['gesture'],
    t: number,
    speechEnergy: number
) {
    const idleYaw = Math.sin(t * 0.35) * 0.035;
    const speechNod = speechEnergy * Math.sin(t * 5.5) * 0.02;
    group.rotation.y = idleYaw;
    group.rotation.x = speechNod;

    if (gesture === 'pointing') {
        group.rotation.y += 0.1;
    } else if (gesture === 'explaining') {
        group.rotation.x += Math.sin(t * 2.2) * 0.02;
    } else if (gesture === 'greeting') {
        group.rotation.y += Math.sin(t * 1.7) * 0.06;
    }
}

function applyRigGesture(
    rig: AvatarRig | null,
    gesture: AvatarModelProps['gesture'],
    t: number,
    speechEnergy: number
) {
    if (!rig) return;
    // Hand gestures disabled per user request
    return;
}

function applyExpressionMorphs(
    meshes: MorphMesh[],
    expression: AvatarModelProps['expression'],
    t: number,
    speechEnergy: number
) {
    const blinkPulse = Math.max(0, Math.sin(t * 0.9 + 1.7));
    const blinkValue = blinkPulse > 0.985 ? THREE.MathUtils.mapLinear(blinkPulse, 0.985, 1, 0, 1) : 0;

    for (const mesh of meshes) {
        const dict = normalizedMorphDictionary(mesh);
        const influences = mesh.morphTargetInfluences;
        if (!dict || !influences) continue;

        relaxAll(influences, 0.15);

        setIfExists(influences, dict, ['eyeBlinkLeft', 'eyeblinkleft', 'blinkleft'], blinkValue, 0.45);
        setIfExists(influences, dict, ['eyeBlinkRight', 'eyeblinkright', 'blinkright'], blinkValue, 0.45);

        const speakSmile = speechEnergy * 0.08;
        setIfExists(influences, dict, ['mouthSmile', 'mouthsmileleft'], speakSmile, 0.14);
        setIfExists(influences, dict, ['mouthSmileRight', 'mouthsmileright'], speakSmile, 0.14);

        switch (expression) {
            case 'happy':
            case 'excited':
                setIfExists(influences, dict, ['mouthSmile', 'mouthsmileleft'], 0.46, 0.22);
                setIfExists(influences, dict, ['mouthSmileRight', 'mouthsmileright'], 0.46, 0.22);
                setIfExists(influences, dict, ['cheekSquintLeft', 'cheeksquintleft'], 0.2, 0.18);
                setIfExists(influences, dict, ['cheekSquintRight', 'cheeksquintright'], 0.2, 0.18);
                if (expression === 'excited') {
                    setIfExists(influences, dict, ['eyeWideLeft', 'eyewideleft'], 0.16, 0.2);
                    setIfExists(influences, dict, ['eyeWideRight', 'eyewideright'], 0.16, 0.2);
                    setIfExists(influences, dict, ['browInnerUp', 'browinnerup'], 0.2, 0.18);
                }
                break;
            case 'thinking':
                setIfExists(influences, dict, ['browInnerUp', 'browinnerup'], 0.36, 0.2);
                setIfExists(influences, dict, ['mouthPressLeft', 'mouthpressleft'], 0.22, 0.2);
                setIfExists(influences, dict, ['mouthPressRight', 'mouthpressright'], 0.22, 0.2);
                break;
            case 'concerned':
                setIfExists(influences, dict, ['browDownLeft', 'browdownleft'], 0.4, 0.2);
                setIfExists(influences, dict, ['browDownRight', 'browdownright'], 0.4, 0.2);
                setIfExists(influences, dict, ['mouthFrownLeft', 'mouthfrownleft'], 0.32, 0.2);
                setIfExists(influences, dict, ['mouthFrownRight', 'mouthfrownright'], 0.32, 0.2);
                break;
            case 'neutral':
            default:
                break;
        }
    }
}

function applyLipSync(meshes: MorphMesh[], speechEnergy: number, visemePhase: number, t: number) {
    const cadence = 0.5 + 0.5 * Math.sin(visemePhase);
    const altCadence = 0.5 + 0.5 * Math.sin(visemePhase * 0.83 + 0.9);
    const closedBeat = 0.5 + 0.5 * Math.sin(t * 8.4 + 2.2);

    for (const mesh of meshes) {
        const dict = normalizedMorphDictionary(mesh);
        const influences = mesh.morphTargetInfluences;
        if (!dict || !influences) continue;

        const jawTarget = speechEnergy * (0.08 + cadence * 0.33);
        const openTarget = speechEnergy * (0.06 + altCadence * 0.22);
        const funnelTarget = speechEnergy * (0.04 + (1 - cadence) * 0.2);
        const puckerTarget = speechEnergy * (0.03 + (1 - altCadence) * 0.16);
        const closeTarget = (1 - speechEnergy) * 0.1 + speechEnergy * closedBeat * 0.05;

        setIfExists(influences, dict, ['jawOpen', 'jawopen'], jawTarget, 0.35);
        setIfExists(influences, dict, ['mouthOpen', 'mouthopen'], openTarget, 0.32);
        setIfExists(influences, dict, ['mouthFunnel', 'mouthfunnel'], funnelTarget, 0.28);
        setIfExists(influences, dict, ['mouthPucker', 'mouthpucker'], puckerTarget, 0.26);
        setIfExists(influences, dict, ['mouthClose', 'mouthclose'], closeTarget, 0.24);
    }
}

function buildAvatarRig(scene: THREE.Object3D): AvatarRig | null {
    const bones: THREE.Bone[] = [];
    scene.traverse((obj) => {
        if (obj instanceof THREE.Bone) bones.push(obj);
    });
    if (bones.length === 0) return null;

    const used = new Set<THREE.Bone>();
    const pick = (...aliases: string[]): RigBone | undefined => {
        for (const alias of aliases) {
            const aliasLower = alias.toLowerCase();
            const bone = bones.find((b) => !used.has(b) && b.name.toLowerCase().includes(aliasLower));
            if (bone) {
                used.add(bone);
                return { bone, rest: bone.quaternion.clone() };
            }
        }
        return undefined;
    };

    return {
        head: pick('head'),
        neck: pick('neck'),
        chest: pick('upperchest', 'chest', 'spine2', 'spine_03', 'spine003'),
        spine: pick('spine1', 'spine', 'spine_02', 'spine002'),
        left: {
            upper: pick('leftupperarm', 'leftarm'),
            lower: pick('leftforearm', 'leftlowerarm'),
            hand: pick('lefthand'),
        },
        right: {
            upper: pick('rightupperarm', 'rightarm'),
            lower: pick('rightforearm', 'rightlowerarm'),
            hand: pick('righthand'),
        },
    };
}

function applyBoneOffset(
    rigBone: RigBone | undefined,
    x: number,
    y: number,
    z: number,
    blend: number
) {
    if (!rigBone) return;
    _tmpEuler.set(x, y, z, 'XYZ');
    _tmpQuat.setFromEuler(_tmpEuler);
    _targetQuat.copy(rigBone.rest).multiply(_tmpQuat);
    rigBone.bone.quaternion.slerp(_targetQuat, blend);
}

function normalizedMorphDictionary(mesh: MorphMesh): MorphTargetMap | null {
    const source = mesh.morphTargetDictionary;
    if (!source) return null;
    const out: MorphTargetMap = {};
    for (const [name, idx] of Object.entries(source)) {
        out[name] = idx;
        out[name.toLowerCase()] = idx;
    }
    return out;
}

function relaxAll(influences: number[], alpha: number) {
    for (let i = 0; i < influences.length; i++) {
        influences[i] = THREE.MathUtils.lerp(influences[i], 0, alpha);
    }
}

function setIfExists(
    influences: number[],
    dict: MorphTargetMap,
    names: string[],
    value: number,
    alpha: number
) {
    for (const name of names) {
        const idx = dict[name];
        if (idx !== undefined) {
            influences[idx] = THREE.MathUtils.lerp(influences[idx], value, alpha);
            return;
        }
    }
}
