import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// Define types for programData structure
interface Progression {
  increment: number;
}

interface MuscleInfo {
  primary: string[];
  secondary: string[];
}

interface BaseExerciseTemplate {
  id: string;
  name: string;
  sets: number; // Number of sets in the template
  reps: string;
  rir: number;
  rest: number;
  startWeight: number;
  progression?: Progression;
  intensification?: 'rest-pause' | 'drop-set' | 'cluster' | 'myo-reps' | 'partials';
  muscles: MuscleInfo;
  bicepsRotation?: boolean;
}

interface SupersetExerciseTemplate extends BaseExerciseTemplate {
  // Specific properties for exercises within a superset
  // NOTE: 'rest' property is inherited from BaseExerciseTemplate.
  // If the intent is for the superset block to define rest, and individual exercises within it
  // have no separate rest, then `rest` should be set to 0 or handled differently in data.
}

interface SupersetBlockTemplate {
  type: 'superset';
  id: string;
  rest: number;
  exercises: SupersetExerciseTemplate[];
}

type ProgramExerciseTemplate = BaseExerciseTemplate | SupersetBlockTemplate;

interface WorkoutTemplate {
  name: string;
  exercises: ProgramExerciseTemplate[];
}

interface HomeWorkoutTemplate extends BaseExerciseTemplate {
    // Home workouts are simple exercises, 'rir' is required by BaseExerciseTemplate
}

interface Block {
  id: number;
  name: string;
  weeks: number[];
  technique: { name: string; desc: string; };
}

interface Projection {
  id: string;
  name: string;
  start: number;
  end: number;
}

interface ProgramData {
  blocks: Block[];
  deloadWeeks: number[];
  workouts: Record<string, WorkoutTemplate>;
  homeWorkouts: Record<string, HomeWorkoutTemplate>;
  stats: {
    projections: Projection[];
  };
}

// Define types for workout history (completed workouts)
interface CompletedSet {
  id: string;
  weight: number | string; // Allow string for user input
  reps: number | string; // Allow string for user input
  rir: number | string; // Allow string for user input
  completed: boolean;
  isBonus?: boolean;
}

interface CompletedBaseExercise extends Omit<BaseExerciseTemplate, 'sets'> { // Omit original 'sets' number
  sets: CompletedSet[]; // Override sets to be an array of CompletedSet
}

interface CompletedSupersetExercise extends Omit<SupersetExerciseTemplate, 'sets'> {
  sets: CompletedSet[]; // Override sets to be an array of CompletedSet
}

interface CompletedSupersetBlock {
  type: 'superset';
  id: string;
  rest: number;
  exercises: CompletedSupersetExercise[];
}

type CompletedWorkoutExercise = CompletedBaseExercise | CompletedSupersetBlock;

interface CompletedWorkout {
  date: string;
  week: number;
  day: string;
  exercises: CompletedWorkoutExercise[];
}

type WorkoutHistory = Record<string, CompletedWorkout>; // This is the type for the `history` state.

// For chart data points
interface ChartDataPoint {
  date: Date;
  weight: number;
}

// Fix: Redefine MuscleVolumeTrendDataPoint to resolve index signature conflict with 'date' property.
// This allows 'date' to be a Date type and other string keys (muscle names) to be numbers.
interface MuscleVolumeTrendDataPoint {
  date: Date;
  [key: string]: number | Date; 
}

const muscleGroups = ["Pectoraux", "Dos", "Quadriceps", "Ischios", "Fessiers", "Épaules", "Biceps", "Triceps", "Avant-bras"];

// Fix: Add missing 'rest' property to SupersetExerciseTemplate for programData initialization.
const programData: ProgramData = {
  blocks: [
    { id: 1, name: "BLOC 1 (S1-5): FONDATION TECHNIQUE", weeks: [1, 2, 3, 4, 5], technique: { name: 'Tempo & Pauses', desc: "Tempo 3-1-2 et pauses stratégiques." } },
    { id: 2, name: "BLOC 2 (S7-11): SURCHARGE PROGRESSIVE", weeks: [7, 8, 9, 10, 11], technique: { name: 'Rest-Pause', desc: "Tempo 2-1-2. Rest-Pause sur la dernière série des exercices principaux." } },
    { id: 3, name: "BLOC 3 (S13-17): SURCOMPENSATION", weeks: [13, 14, 15, 16, 17], technique: { name: 'Drop-Sets & Myo-Reps', desc: "Drop-sets et Myo-reps sur la dernière série des isolations." } },
    { id: 4, name: "BLOC 4 (S19-25): INTENSIFICATION MAXIMALE", weeks: [19, 20, 21, 22, 23, 25], technique: { name: 'Clusters & Partials', desc: "Clusters, Myo-reps sur toutes les isolations, et Partials." } },
  ],
  deloadWeeks: [6, 12, 18, 24, 26],
  workouts: {
    dimanche: {
      name: "Dos + Jambes Lourdes + Bras",
      exercises: [
        { id: 'tbdl', name: 'Trap Bar Deadlift', sets: 5, reps: '6-8', rir: 2, rest: 120, startWeight: 75, progression: { increment: 5 }, intensification: 'rest-pause', muscles: { primary: ["Dos", "Fessiers", "Ischios"], secondary: ["Quadriceps"] } },
        { id: 'goblet', name: 'Goblet Squat', sets: 4, reps: '10', rir: 2, rest: 75, startWeight: 25, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Quadriceps", "Fessiers"], secondary: ["Ischios"] } },
        { id: 'legpress', name: 'Leg Press', sets: 4, reps: '10', rir: 2, rest: 75, startWeight: 110, progression: { increment: 10 }, intensification: 'cluster', muscles: { primary: ["Quadriceps", "Fessiers"], secondary: ["Ischios"] } },
        { type: 'superset', id: 'superset_dos_pecs', rest: 90, exercises: [
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'latpull', name: 'Lat Pulldown (large)', sets: 4, reps: '10', rir: 2, rest: 0, startWeight: 60, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Dos"], secondary: ["Biceps"] } },
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'landminepress', name: 'Landmine Press', sets: 4, reps: '10', rir: 2, rest: 0, startWeight: 35, muscles: { primary: ["Pectoraux", "Épaules"], secondary: ["Triceps"] } }
        ]},
        { id: 'rowmachine', name: 'Rowing Machine (large)', sets: 4, reps: '10', rir: 2, rest: 75, startWeight: 50, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Dos"], secondary: ["Biceps", "Épaules"] } },
        { type: 'superset', id: 'superset_bras_dim', rest: 75, exercises: [
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'biceps_dim', name: 'Spider Curl / Incline Curl', sets: 4, reps: '12', rir: 1, rest: 0, startWeight: 12, progression: { increment: 2.5 }, bicepsRotation: true, intensification: 'myo-reps', muscles: { primary: ["Biceps"], secondary: [] } },
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'pushdown', name: 'Cable Pushdown', sets: 3, reps: '12', rir: 1, rest: 0, startWeight: 20, progression: { increment: 2.5 }, muscles: { primary: ["Triceps"], secondary: [] } }
        ]},
      ]
    },
    mardi: {
      name: "Pecs + Épaules + Triceps",
      exercises: [
        { id: 'dbpress', name: 'Dumbbell Press', sets: 5, reps: '10', rir: 2, rest: 105, startWeight: 22, progression: { increment: 2.5 }, intensification: 'rest-pause', muscles: { primary: ["Pectoraux"], secondary: ["Épaules", "Triceps"] } },
        { id: 'cablefly', name: 'Cable Fly', sets: 4, reps: '12', rir: 1, rest: 60, startWeight: 10, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Pectoraux"], secondary: [] } },
        { id: 'legpresslight', name: 'Leg Press léger', sets: 3, reps: '15', rir: 2, rest: 60, startWeight: 80, progression: { increment: 10 }, muscles: { primary: ["Quadriceps", "Fessiers"], secondary: [] } },
        { type: 'superset', id: 'superset_tri_epaules', rest: 75, exercises: [
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'tricepsext', name: 'Extension Triceps Corde', sets: 5, reps: '12', rir: 1, rest: 0, startWeight: 20, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Triceps"], secondary: [] } },
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'latraises', name: 'Lateral Raises', sets: 5, reps: '15', rir: 1, rest: 0, startWeight: 8, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Épaules"], secondary: [] } }
        ]},
        { id: 'facepull', name: 'Face Pull', sets: 5, reps: '15', rir: 2, rest: 60, startWeight: 20, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Épaules", "Dos"], secondary: [] } },
        { id: 'rowmachineserre', name: 'Rowing Machine (serrée)', sets: 4, reps: '12', rir: 2, rest: 75, startWeight: 50, progression: { increment: 2.5 }, muscles: { primary: ["Dos"], secondary: ["Biceps"] } },
        { id: 'overheadext', name: 'Overhead Extension', sets: 4, reps: '12', rir: 1, rest: 60, startWeight: 15, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Triceps"], secondary: [] } },
      ]
    },
    vendredi: {
      name: "Dos + Jambes Légères + Bras + Épaules",
      exercises: [
        { id: 'landminerow', name: 'Landmine Row', sets: 5, reps: '10', rir: 2, rest: 105, startWeight: 55, progression: { increment: 2.5 }, intensification: 'rest-pause', muscles: { primary: ["Dos"], secondary: ["Biceps"] } },
        { type: 'superset', id: 'superset_jambes_ven', rest: 75, exercises: [
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'legcurl', name: 'Leg Curl', sets: 5, reps: '12', rir: 1, rest: 0, startWeight: 40, progression: { increment: 5 }, intensification: 'partials', muscles: { primary: ["Ischios"], secondary: [] } },
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'legext', name: 'Leg Extension', sets: 4, reps: '15', rir: 1, rest: 0, startWeight: 35, progression: { increment: 5 }, intensification: 'partials', muscles: { primary: ["Quadriceps"], secondary: [] } }
        ]},
        { type: 'superset', id: 'superset_pecs_ven', rest: 60, exercises: [
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'cablefly_ven', name: 'Cable Fly', sets: 4, reps: '15', rir: 1, rest: 0, startWeight: 10, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Pectoraux"], secondary: [] } },
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'dbfly', name: 'Dumbbell Fly', sets: 4, reps: '12', rir: 1, rest: 0, startWeight: 10, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Pectoraux"], secondary: [] } }
        ]},
        { type: 'superset', id: 'superset_bras_ven', rest: 75, exercises: [
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'ezcurl', name: 'EZ Bar Curl', sets: 5, reps: '12', rir: 1, rest: 0, startWeight: 25, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Biceps"], secondary: [] } },
            // Fix: Add missing 'rest' property to SupersetExerciseTemplate
            { id: 'overheadext_ven', name: 'Overhead Extension', sets: 3, reps: '12', rir: 1, rest: 0, startWeight: 15, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Triceps"], secondary: [] } }
        ]},
        { id: 'latraises_ven', name: 'Lateral Raises', sets: 3, reps: '15', rir: 1, rest: 60, startWeight: 8, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Épaules"], secondary: [] } },
        { id: 'wristcurl', name: 'Wrist Curl', sets: 3, reps: '20', rir: 0, rest: 45, startWeight: 30, progression: { increment: 2.5 }, muscles: { primary: ["Avant-bras"], secondary: [] } },
      ]
    },
  },
  homeWorkouts: {
    // Fix: Add missing 'rir' property to HomeWorkoutTemplate
    mardi: { id: 'hammer_home', name: 'Hammer Curl', sets: 3, reps: '12', rir: 1, rest: 60, startWeight: 12, progression: { increment: 2.5 }, muscles: { primary: ["Biceps", "Avant-bras"], secondary: [] } },
    // Fix: Add missing 'rir' property to HomeWorkoutTemplate
    jeudi: { id: 'hammer_home', name: 'Hammer Curl', sets: 3, reps: '12', rir: 1, rest: 60, startWeight: 12, progression: { increment: 2.5 }, muscles: { primary: ["Biceps", "Avant-bras"], secondary: [] } }
  },
  stats: {
    projections: [
        { id: 'tbdl', name: 'Trap Bar DL', start: 75, end: 120 },
        { id: 'dbpress', name: 'Dumbbell Press', start: 22, end: 45 },
        { id: 'legpress', name: 'Leg Press', start: 110, end: 240 },
        { id: 'rowmachine', name: 'Rowing Machine', start: 50, end: 82.5 },
        { id: 'ezcurl', name: 'EZ Bar Curl', start: 25, end: 47.5 },
    ]
  }
};

const DB_KEY = 'hybridMaster51_data_v4';

/**
 * Type guard to check if an exercise is a CompletedSupersetBlock.
 */
function isCompletedSupersetBlock(exercise: CompletedWorkoutExercise): exercise is CompletedSupersetBlock {
  return (exercise as CompletedSupersetBlock).type === 'superset';
}

/**
 * Type guard to check if an exercise is a SupersetBlockTemplate.
 */
function isProgramSupersetBlockTemplate(exercise: ProgramExerciseTemplate): exercise is SupersetBlockTemplate {
  return (exercise as SupersetBlockTemplate).type === 'superset';
}

/**
 * Type guard to check if an exercise is a BaseExerciseTemplate.
 */
function isProgramBaseExerciseTemplate(exercise: ProgramExerciseTemplate): exercise is BaseExerciseTemplate {
  return !('type' in exercise); // BaseExerciseTemplate does not have a 'type' property
}


const generateMockHistory = (): WorkoutHistory => {
    const mockHistory: WorkoutHistory = {};
    const today = new Date();
    const totalWeeks = 8;

    for (let week = 0; week < totalWeeks; week++) {
        const daysInPast = (totalWeeks - 1 - week) * 7;
        
        ['dimanche', 'mardi', 'vendredi'].forEach(day => {
            const workoutTemplate = programData.workouts[day];
            if (!workoutTemplate) return;

            let dayOffset;
            switch(day) {
                case 'dimanche': dayOffset = 0; break;
                case 'mardi': dayOffset = 2; break;
                case 'vendredi': dayOffset = 5; break;
                default: dayOffset = 0;
            }
            const workoutDate = new Date(today);
            workoutDate.setDate(today.getDate() - daysInPast - (today.getDay() - dayOffset + 7) % 7);
            const dateString = workoutDate.toISOString();

            const completedWorkout: CompletedWorkout = {
                date: dateString,
                week: week + 1,
                day: day,
                exercises: JSON.parse(JSON.stringify(workoutTemplate.exercises)).map((exoTemplate: ProgramExerciseTemplate) => {
                    // Fix: Refine processExo signature and return type based on input type.
                    const processExo = <T extends BaseExerciseTemplate | SupersetExerciseTemplate>(
                        subExoTemplate: T
                    ): T extends SupersetExerciseTemplate ? CompletedSupersetExercise : CompletedBaseExercise => {
                        const newCompletedExo: CompletedBaseExercise | CompletedSupersetExercise = {
                            ...subExoTemplate,
                            sets: [],
                        } as CompletedBaseExercise | CompletedSupersetExercise; // Temporary cast to satisfy TS initially

                        const numSets = subExoTemplate.sets; // Use sets from original template (which is a number)
                        const targetReps = parseInt((subExoTemplate.reps || '8').split('-')[0]); // Use subExoTemplate.reps
                        // Ensure progression is defined before accessing its properties
                        const progressionIncrement = (subExoTemplate.progression && subExoTemplate.progression.increment) ? subExoTemplate.progression.increment : 2.5;
                        const startWeight = subExoTemplate.startWeight !== undefined ? subExoTemplate.startWeight : 0; // Fallback for startWeight
                        
                        newCompletedExo.sets = Array.from({ length: numSets }, (_, i) => {
                            const weight = startWeight + (week * progressionIncrement * 0.75);
                            return {
                                id: `${subExoTemplate.id}-${i}-${Date.now()}-${Math.random()}`, // Unique ID for each set
                                weight: Math.round(weight * 4) / 4,
                                reps: targetReps + Math.floor(Math.random() * 3) - 1,
                                rir: Math.floor(Math.random() * 2) + 1,
                                completed: true
                            };
                        });
                        return newCompletedExo as (T extends SupersetExerciseTemplate ? CompletedSupersetExercise : CompletedBaseExercise);
                    };

                    // Fix: Use type guard for ProgramExerciseTemplate
                    if (isProgramSupersetBlockTemplate(exoTemplate)) {
                        // For supersets, map exercises within the superset
                        return { 
                            ...exoTemplate, 
                            exercises: exoTemplate.exercises.map(e => processExo(e) as CompletedSupersetExercise) 
                        } as CompletedSupersetBlock;
                    } else {
                        // For regular exercises
                        return processExo(exoTemplate as BaseExerciseTemplate) as CompletedBaseExercise;
                    }
                })
            };
            mockHistory[dateString] = completedWorkout;
        });
    }
    return mockHistory;
};


const useWorkoutHistory = () => {
    const [history, setHistory] = useState<WorkoutHistory>(() => {
        try {
            const savedData = localStorage.getItem(DB_KEY);
            if (savedData) {
                const parsedData: WorkoutHistory = JSON.parse(savedData);
                if (Object.keys(parsedData).length > 0) {
                    return parsedData;
                }
            }
            const mockData = generateMockHistory();
            localStorage.setItem(DB_KEY, JSON.stringify(mockData));
            return mockData;
        } catch (e) {
            console.error("Failed to load or generate history:", e);
             try {
                const mockData = generateMockHistory();
                localStorage.setItem(DB_KEY, JSON.stringify(mockData));
                return mockData;
            } catch (genError) {
                console.error("Failed to generate mock history as fallback:", genError);
                return {};
            }
        }
    });

    const saveWorkout = useCallback((w: CompletedWorkout) => {
        const newHistory = { ...history, [w.date]: w };
        setHistory(newHistory);
        localStorage.setItem(DB_KEY, JSON.stringify(newHistory));
    }, [history]);
    
    // Explicitly type `workout` as `CompletedWorkout`
    const getExercisePR = useCallback((exerciseId: string) => {
        let best = { weight: 0, reps: 0 };
        Object.values(history).forEach((workout: CompletedWorkout) => {
            if (!workout?.exercises) return;
            const processExo = (exo: CompletedBaseExercise | CompletedSupersetExercise) => {
                if (exo.id === exerciseId) { // Check if it's a BaseExercise or SupersetExercise
                    (exo.sets || []).forEach((set) => {
                        const w = parseFloat(String(set.weight));
                        const r = parseInt(String(set.reps));
                        if (set.completed && w >= best.weight) {
                            if (w > best.weight) best = { weight: w, reps: r };
                            else if (r > best.reps) best.reps = r;
                        }
                    });
                }
            };
            workout.exercises.forEach((exo: CompletedWorkoutExercise) => { 
                // Fix: Use type guard for CompletedWorkoutExercise
                if (isCompletedSupersetBlock(exo)) {
                    exo.exercises.forEach(processExo);
                } else {
                    processExo(exo as CompletedBaseExercise); // exo is CompletedBaseExercise
                }
            });
        });
        return best;
    }, [history]);

    // Explicitly type `workout` as `CompletedWorkout`
    const getBestSetVolume = useCallback((exerciseId: string) => {
        let bestVolume = 0;
        Object.values(history).forEach((workout: CompletedWorkout) => {
            if (!workout?.exercises) return;
            workout.exercises.forEach((exo: CompletedWorkoutExercise) => {
                const processExo = (subExo: CompletedBaseExercise | CompletedSupersetExercise) => {
                    if (subExo.id === exerciseId) {
                        (subExo.sets || []).forEach(set => {
                            if (set.completed) {
                                const volume = (parseFloat(String(set.weight)) || 0) * (parseInt(String(set.reps)) || 0);
                                if (volume > bestVolume) {
                                    bestVolume = volume;
                                }
                            }
                        });
                    }
                };
                // Fix: Use type guard for CompletedWorkoutExercise
                if (isCompletedSupersetBlock(exo)) exo.exercises.forEach(processExo);
                else processExo(exo as CompletedBaseExercise); // exo is CompletedBaseExercise
            });
        });
        return Math.round(bestVolume);
    }, [history]);

    // Explicitly type `workout` as `CompletedWorkout`
    const getMostReps = useCallback((exerciseId: string) => {
        let mostReps = 0;
        Object.values(history).forEach((workout: CompletedWorkout) => {
            if (!workout?.exercises) return;
            workout.exercises.forEach((exo: CompletedWorkoutExercise) => {
                const processExo = (subExo: CompletedBaseExercise | CompletedSupersetExercise) => {
                    if (subExo.id === exerciseId) {
                        (subExo.sets || []).forEach(set => {
                            if (set.completed) {
                                const reps = parseInt(String(set.reps)) || 0;
                                if (reps > mostReps) {
                                    mostReps = reps;
                                }
                            }
                        });
                    }
                };
                // Fix: Use type guard for CompletedWorkoutExercise
                if (isCompletedSupersetBlock(exo)) exo.exercises.forEach(processExo);
                else processExo(exo as CompletedBaseExercise); // exo is CompletedBaseExercise
            });
        });
        return mostReps;
    }, [history]);

    // Explicitly type `workout` as `CompletedWorkout`
    const getProjected1RM = useCallback((exerciseId: string) => {
        let best1RM = 0;
        Object.values(history).forEach((workout: CompletedWorkout) => {
            if (!workout?.exercises) return;
            workout.exercises.forEach((exo: CompletedWorkoutExercise) => {
                const processExo = (subExo: CompletedBaseExercise | CompletedSupersetExercise) => {
                    if (subExo.id === exerciseId) {
                        (subExo.sets || []).forEach(set => {
                            if (set.completed) {
                                const weight = parseFloat(String(set.weight)) || 0;
                                const reps = parseInt(String(set.reps)) || 0;
                                if (reps > 0) {
                                    const projectedRM = weight * (1 + reps / 30);
                                    if (projectedRM > best1RM) {
                                        best1RM = projectedRM;
                                    }
                                }
                            }
                        });
                    }
                };
                if (isCompletedSupersetBlock(exo)) exo.exercises.forEach(processExo);
                else processExo(exo as CompletedBaseExercise);
            });
        });
        return Math.round(best1RM);
    }, [history]);

    const getWorkoutHistoryForExercise = useCallback((exerciseId: string) => {
        const exerciseHistory: { date: Date; sets: { weight: number; reps: number; rir: number }[] }[] = [];
        Object.values(history)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending
            .forEach((workout: CompletedWorkout) => {
                const date = new Date(workout.date);
                workout.exercises.forEach((exo: CompletedWorkoutExercise) => {
                    const processExo = (subExo: CompletedBaseExercise | CompletedSupersetExercise) => {
                        if (subExo.id === exerciseId && subExo.sets && subExo.sets.some(s => s.completed)) {
                            exerciseHistory.push({
                                date: date,
                                sets: subExo.sets.filter(s => s.completed).map(s => ({
                                    weight: parseFloat(String(s.weight)) || 0,
                                    reps: parseInt(String(s.reps)) || 0,
                                    rir: parseInt(String(s.rir)) || 0,
                                })),
                            });
                        }
                    };
                    if (isCompletedSupersetBlock(exo)) exo.exercises.forEach(processExo);
                    else processExo(exo as CompletedBaseExercise);
                });
            });
        return exerciseHistory;
    }, [history]);

    const getSuggestedWeight = useCallback((exercise: BaseExerciseTemplate | SupersetExerciseTemplate | HomeWorkoutTemplate) => {
        const exerciseId = exercise.id;
        let lastLoggedWeight = exercise.startWeight;
        let lastLoggedReps = parseInt((exercise.reps || '8').split('-')[0]); // Default reps from template

        const sortedWorkouts = Object.values(history).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        for (const workout of sortedWorkouts) {
            if (!workout?.exercises) continue;

            const processExo = (subExo: CompletedBaseExercise | CompletedSupersetExercise): boolean => {
                if (subExo.id === exerciseId && subExo.sets) {
                    // Find the last completed set with valid weight
                    for (let i = subExo.sets.length - 1; i >= 0; i--) {
                        const set = subExo.sets[i];
                        if (set.completed && parseFloat(String(set.weight)) > 0) {
                            lastLoggedWeight = parseFloat(String(set.weight));
                            lastLoggedReps = parseInt(String(set.reps)); // Update last logged reps too
                            return true; // Found a relevant set, stop searching for this exercise
                        }
                    }
                }
                return false;
            };

            for (const exo of workout.exercises) {
                if (isCompletedSupersetBlock(exo) && exo.exercises) {
                    if (exo.exercises.some(processExo)) return lastLoggedWeight;
                } else {
                    if (processExo(exo as CompletedBaseExercise)) return lastLoggedWeight;
                }
            }
        }
        return lastLoggedWeight;
    }, [history]);

    return { history, saveWorkout, getExercisePR, getSuggestedWeight, getBestSetVolume, getMostReps, getProjected1RM, getWorkoutHistoryForExercise };
};

const DumbbellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 8.5C21 7.12 19.88 6 18.5 6H17V5C17 4.45 16.55 4 16 4H8C7.45 4 7 4.45 7 5V6H5.5C4.12 6 3 7.12 3 8.5V15.5C3 16.88 4.12 18 5.5 18H7V19C7 19.55 7.45 20 8 20H16C16.55 20 17 19.55 17 19V18H18.5C19.88 18 21 16.88 21 15.5V8.5ZM5 16.5V8.5C5 8.22 5.22 8 5.5 8H6V16H5.5C5.22 16 5 16.28 5 16.5ZM19 15.5C19 16.28 18.78 16 18.5 16H18V8H18.5C18.78 8 19 8.22 19 8.5V15.5Z"/></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6H18V20H16V6ZM11 11H13V20H11V11ZM6 16H8V20H6V16ZM20 2H2V4H20V2Z"/></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const WorkoutIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const WeightIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>;
const SetsIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" /></svg>;
const ArrowPathIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M15.75 2.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V4.53L8.03 11.03a.75.75 0 0 1-1.06-1.06L13.47 3.5H9a.75.75 0 0 1 0-1.5h6.75Zm-8.25 9a.75.75 0 0 0-.75-.75h-6a.75.75 0 0 0 0 1.5h4.53L-1.03 1.53a.75.75 0 1 0 1.06 1.06L6.53 9H3a.75.75 0 0 0-.75.75v6.75a.75.75 0 0 0 1.5 0v-4.53l6.47 6.47a.75.75 0 0 0 1.06-1.06L5.53 15H9.75a.75.75 0 0 0 .75-.75Z" clipRule="evenodd" /></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clipRule="evenodd" /></svg>;
const TimeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
const PlusMinusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;


const MuscleGroupHeatmap = ({ workout }: { workout: WorkoutTemplate | null }) => {
  if (!workout) return null;

  const workedMuscles = { primary: new Set<string>(), secondary: new Set<string>() };

  workout.exercises.forEach(exo => {
    if (isProgramSupersetBlockTemplate(exo)) {
      exo.exercises.forEach(subExo => {
        if (subExo.muscles) {
          subExo.muscles.primary.forEach(m => workedMuscles.primary.add(m));
          subExo.muscles.secondary.forEach(m => workedMuscles.secondary.add(m));
        }
      });
    } else {
      const baseExo = exo as BaseExerciseTemplate;
      if (baseExo.muscles) {
        baseExo.muscles.primary.forEach(m => workedMuscles.primary.add(m));
        baseExo.muscles.secondary.forEach(m => workedMuscles.secondary.add(m));
      }
    }
  });

  return (
    <div className="muscle-heatmap">
      {muscleGroups.map(muscle => {
        const isPrimary = workedMuscles.primary.has(muscle);
        const isSecondary = workedMuscles.secondary.has(muscle) && !isPrimary;
        let status = 'inactive';
        if (isPrimary) status = 'primary';
        else if (isSecondary) status = 'secondary';
        return (
          <div key={muscle} className={`muscle-tag muscle-${status}`}>
            {muscle}
          </div>
        );
      })}
    </div>
  );
};

const ProgressionChart = ({ exerciseId, exerciseName, history }: { exerciseId: string; exerciseName: string; history: WorkoutHistory }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  const dataPoints = useMemo(() => {
    const points: ChartDataPoint[] = [];
    Object.values(history).forEach((w) => {
      if (!w?.exercises) return;
      let maxWeight = 0;
      w.exercises.forEach((exo) => {
        const subExercises = isCompletedSupersetBlock(exo) ? exo.exercises : [exo];
        subExercises.forEach((subExo) => {
          if (subExo.id === exerciseId) {
            (subExo.sets || []).forEach((set) => {
              if (set.completed) {
                maxWeight = Math.max(maxWeight, parseFloat(String(set.weight)));
              }
            });
          }
        });
      });
      if (maxWeight > 0) points.push({ date: new Date(w.date), weight: maxWeight });
    });
    return points.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [history, exerciseId]);

  if (dataPoints.length < 2) {
    return <div className="progression-chart-container"><p className="empty-stat-small">Enregistrez au moins 2 séances pour voir la courbe.</p></div>;
  }

  const margin = { top: 20, right: 20, bottom: 30, left: 35 };
  const width = 350 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  const weights = dataPoints.map(p => p.weight);
  const dates = dataPoints.map(p => p.date);

  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight === 0 ? 1 : maxWeight - minWeight;

  const minDate = dates[0].getTime();
  const maxDate = dates[dates.length - 1].getTime();
  const dateRange = maxDate - minDate === 0 ? 1 : maxDate - minDate;

  const getX = (date: Date) => ((date.getTime() - minDate) / dateRange) * width;
  const getY = (weight: number) => height - ((weight - minWeight) / weightRange) * height;

  const path = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.date)} ${getY(p.weight)}`).join(' ');

  const handleMouseMove = (e: React.MouseEvent<SVGCircleElement>, dataPoint: ChartDataPoint) => {
    const svgRect = (e.target as SVGCircleElement).ownerSVGElement!.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();

    if (svgRect && containerRect) {
      setTooltip({
        x: svgRect.left - containerRect.left + getX(dataPoint.date) + margin.left,
        y: svgRect.top - containerRect.top + getY(dataPoint.weight),
        content: `${dataPoint.weight} kg - ${dataPoint.date.toLocaleDateString('fr-FR')}`
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="progression-chart-container" ref={containerRef} onMouseLeave={handleMouseLeave}>
      <svg className="progression-chart-svg" viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Y-axis grid lines and labels */}
          {Array.from({ length: 5 }).map((_, i) => {
            const y = height * (i / 4);
            const weight = maxWeight - (i / 4) * weightRange;
            return (
              <g key={i}>
                <line className="grid-line" x1={0} x2={width} y1={y} y2={y} />
                <text className="axis-label" x={-5} y={y + 3} textAnchor='end'>{Math.round(weight)}</text>
              </g>
            );
          })}
          {/* X-axis labels (simplified to 3 points for clarity) */}
          {Array.from({ length: 3 }).map((_, i) => {
            const date = new Date(minDate + (i / 2) * dateRange);
            const x = getX(date);
            return (
              <text key={i} className="axis-label" x={x} y={height + 15} textAnchor='middle'>
                {date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })}
              </text>
            );
          })}

          <path className="data-line" d={path} stroke="url(#line-gradient-chart)" />
          {dataPoints.map((p, i) => (
            <circle
              key={i}
              className="data-point"
              cx={getX(p.date)}
              cy={getY(p.weight)}
              r={4}
              onMouseEnter={(e) => handleMouseMove(e, p)}
            />
          ))}

          <defs>
            <linearGradient id="line-gradient-chart" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-primary)" />
              <stop offset="100%" stopColor="var(--color-primary-light)" />
            </linearGradient>
          </defs>
        </g>
      </svg>
      {tooltip && (
        <div
          className="chart-tooltip visible"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};


const CircularRestTimer = ({ duration, onFinish, currentExerciseName, nextSetInfo }: { duration: number; onFinish: () => void; currentExerciseName?: string; nextSetInfo?: string; }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  // Get CSS variables for stroke width
  const style = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null;
  const strokeWidth = parseFloat(style?.getPropertyValue('--rest-timer-stroke-width') || '0');
  const radius = 100 - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;


  useEffect(() => {
    if (timeLeft <= 0) {
      onFinish();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onFinish]);

  const handleAdjustTime = (amount: number) => {
    setTimeLeft(t => Math.max(0, t + amount));
  };

  const progressOffset = circumference - (timeLeft / duration) * circumference;

  return (
    <div className="rest-timer-overlay">
      <div className="timer-container">
        <svg className="timer-circle-svg" viewBox="0 0 200 200">
          <circle
            className="timer-track"
            cx="100"
            cy="100"
            r={radius}
            strokeDasharray={circumference}
          />
          <circle
            className="timer-progress"
            cx="100"
            cy="100"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
          />
        </svg>
        <div className="timer-content">
          <div className="timer-time">
            {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
          </div>
          {currentExerciseName && (
            <div className="timer-next-exercise">
              Prochaine: <strong>{currentExerciseName}</strong>{nextSetInfo && ` - ${nextSetInfo}`}
            </div>
          )}
        </div>
      </div>
      <div className="timer-controls">
        <button onClick={() => handleAdjustTime(-15)} aria-label="Réduire le temps de repos de 15 secondes">-15s</button>
        <button onClick={() => handleAdjustTime(15)} aria-label="Augmenter le temps de repos de 15 secondes">+15s</button>
      </div>
      <button className="skip-timer-btn" onClick={onFinish}>Passer</button>
    </div>
  );
};


interface IntensificationStepProps {
  title: string;
  description: string | null;
  actionText: string;
  onAction: () => void;
  timer: number | null;
}

const IntensificationStep = ({ title, description, actionText, onAction, timer }: IntensificationStepProps) => {
  const [timeLeft, setTimeLeft] = useState(timer);

  useEffect(() => {
    if (!timer) return;
    const interval = setInterval(() => setTimeLeft(t => (!t || t <= 1 ? 0 : t - 1)), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  return (
    <div className="intensification-prompt">
      <h4>{title}</h4>
      {description && <p>{description}</p>}
      {timer && <div className="intensification-timer">Repos: {timeLeft}s</div>}
      <button className="intensification-action" onClick={onAction} disabled={!!(timeLeft && timeLeft > 0)}>
        {actionText}
      </button>
    </div>
  );
};

interface TechniqueHighlightProps {
  exercise: CompletedWorkoutExercise;
  block: Block;
}

const TechniqueHighlight = ({ exercise, block }: TechniqueHighlightProps) => {
  if (!block) return null;

  const getTechniqueForExo = (exo: BaseExerciseTemplate | SupersetExerciseTemplate) => {
    if (!exo.intensification) return null;

    const techName = block.technique.name.toLowerCase();
    // Check if the block's technique name includes the intensification type
    // Example: "Rest-Pause" for 'rest-pause', "Drop-Sets & Myo-Reps" for 'drop-set' or 'myo-reps'
    if (techName.includes(exo.intensification.replace('-', ''))) {
      // Return the primary technique name for display, e.g., "Rest-Pause" from "Rest-Pause & Myo-Reps"
      return block.technique.name.split('&')[0].trim();
    }
    return null;
  };

  const techniques: string[] = [];
  if (isCompletedSupersetBlock(exercise)) {
    exercise.exercises.forEach(exo => {
      const tech = getTechniqueForExo(exo);
      if (tech && !techniques.includes(tech)) {
        techniques.push(tech);
      }
    });
  } else {
    const tech = getTechniqueForExo(exercise as BaseExerciseTemplate);
    if (tech) {
      techniques.push(tech);
    }
  }

  if (techniques.length === 0) return null;

  return (
    <div className="technique-highlight-box">
      <strong>🔥 Technique Spéciale: </strong>
      {techniques.join(' / ')}
    </div>
  );
};


interface SetsTrackerProps {
  exercise: CompletedWorkoutExercise;
  onSetComplete: (isCompleted: boolean, setIndex: number, subExoIndex?: number) => void;
  onInputChange: (value: string, field: 'weight' | 'reps' | 'rir', setIndex: number, subExoIndex?: number) => void;
  onAddBonusSet: (newSet: Omit<CompletedSet, 'id' | 'completed'>, subExoIndex?: number) => void;
  block: Block;
  activeSetIndex: number;
}

const SetsTracker = ({ exercise, onSetComplete, onInputChange, onAddBonusSet, block, activeSetIndex }: SetsTrackerProps) => {
  const [intensificationState, setIntensificationState] = useState<{ active: boolean; step: number; type: string | null; }>({ active: false, step: 0, type: null });

  const handleCheck = (set: CompletedSet, setIndex: number, subExoIndex: number = -1) => {
    onSetComplete(!set.completed, setIndex, subExoIndex);

    const individualExoForIntensification = isCompletedSupersetBlock(exercise)
      ? exercise.exercises[subExoIndex]
      : exercise as CompletedBaseExercise;

    // Check if this set is the last non-bonus set of the exercise/sub-exercise
    const nonBonusSets = individualExoForIntensification.sets.filter((s) => !s.isBonus);
    if (!set.completed && !set.isBonus && setIndex === nonBonusSets.length - 1) {
      if (individualExoForIntensification.intensification) {
        setIntensificationState({ active: true, type: individualExoForIntensification.intensification, step: 1 });
      }
    }
  };

  const renderIntensificationGuide = (exo: CompletedBaseExercise | CompletedSupersetExercise, subExoIndex: number = -1) => {
    if (!exo.intensification) {
      return null;
    }
    if (!intensificationState.active || intensificationState.type !== exo.intensification || !block) return null;

    const setsToConsider = exo.sets || [];
    const lastSet = [...setsToConsider].filter((s) => !s.isBonus).pop(); // Get the last non-bonus set
    if (!lastSet) return null;

    // Logic for Rest-Pause
    if (block.technique.name === 'Rest-Pause' && intensificationState.type === 'rest-pause') {
      return (
        <IntensificationStep
          title="🔥 Rest-Pause"
          description={null}
          actionText="Ajouter la série bonus"
          onAction={() => {
            onAddBonusSet({ weight: lastSet.weight, reps: '', rir: 0 }, subExoIndex);
            setIntensificationState({ active: false, step: 0, type: null });
          }}
          timer={20} // 20-second rest for rest-pause
        />
      );
    }

    // Logic for Drop-Set
    if (block.technique.name.includes('Drop-Sets') && intensificationState.type === 'drop-set') {
      return (
        <IntensificationStep
          title="🔥 Drop-Set"
          description="Baissez le poids de ~25%."
          actionText="Ajouter la série Drop"
          onAction={() => {
            onAddBonusSet({ weight: (parseFloat(String(lastSet.weight)) * 0.75).toFixed(1), reps: '', rir: 0 }, subExoIndex);
            setIntensificationState({ active: false, step: 0, type: null });
          }}
          timer={null} // No timer, immediately proceed to next set
        />
      );
    }

    // Add more intensification techniques here if needed
    return null;
  };

  if (isCompletedSupersetBlock(exercise)) {
    // For superset blocks, determine number of sets from the first exercise
    const numSets = exercise.exercises.length > 0 ? exercise.exercises[0].sets.filter(s => !s.isBonus).length : 0;
    
    return (
      <div className="sets-tracker">
        {Array.from({ length: numSets }).map((_, setIndex) => {
          // A superset set is completed if ALL exercises in it are completed for that setIndex
          const isCompleted = exercise.exercises.every(e => e.sets[setIndex]?.completed);
          const isActive = setIndex === activeSetIndex;
          const rowClasses = `superset-set-row ${isActive ? 'active' : ''}`;

          return (
            <div className={rowClasses} key={`superset-set-${setIndex}`}>
              <div className="superset-set-header">
                <div className="superset-set-number">Série {setIndex + 1}</div>
                <button
                  aria-label={`Valider série ${setIndex + 1} du superset`}
                  className={`set-check-btn ${isCompleted ? 'completed' : ''}`}
                  onClick={() => {
                    const newCompletedStatus = !isCompleted;
                    exercise.exercises.forEach((_, subExoIndex) => {
                      onSetComplete(newCompletedStatus, setIndex, subExoIndex);
                    });
                  }}
                >
                  ✓
                </button>
              </div>
              <div className="superset-set-exercises">
                {exercise.exercises.map((subExo, subExoIndex) => (
                  <div className="superset-set-exercise-card" key={`${subExo.id}-${setIndex}`}>
                    <div className="superset-set-exercise-name">{subExo.name}</div>
                    <div className="superset-set-inputs">
                      <div className="set-input">
                        <label>Poids</label>
                        <input
                          aria-label={`Poids pour ${subExo.name} série ${setIndex + 1}`}
                          type="number"
                          value={subExo.sets[setIndex]?.weight || ''}
                          onChange={(e) => onInputChange(e.target.value, 'weight', setIndex, subExoIndex)}
                        />
                      </div>
                      <div className="set-input">
                        <label>Reps</label>
                        <input
                          aria-label={`Reps pour ${subExo.name} série ${setIndex + 1}`}
                          type="number"
                          value={subExo.sets[setIndex]?.reps || ''}
                          onChange={(e) => onInputChange(e.target.value, 'reps', setIndex, subExoIndex)}
                        />
                      </div>
                      <div className="set-input">
                        <label>RIR</label>
                        <input
                          aria-label={`RIR pour ${subExo.name} série ${setIndex + 1}`}
                          type="number"
                          value={subExo.sets[setIndex]?.rir || ''}
                          onChange={(e) => onInputChange(e.target.value, 'rir', setIndex, subExoIndex)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const baseExercise = exercise as CompletedBaseExercise;
  return (
    <div className="sets-tracker-container">
      <div className="sets-tracker">
        {baseExercise.sets.map((set, index) => {
          const isActive = index === activeSetIndex;
          const rowClasses = `set-row ${set.isBonus ? 'bonus-set' : ''} ${isActive ? 'active' : ''}`;
          return (
            <div className={rowClasses} key={set.id || index}>
              <div className="set-number">{set.isBonus ? '🔥' : index + 1}</div>
              <div className="set-input">
                <label>Poids</label>
                <input
                  aria-label={`Poids pour série ${index + 1}`}
                  type="number"
                  value={set.weight}
                  onChange={(e) => onInputChange(e.target.value, 'weight', index)}
                />
              </div>
              <div className="set-input">
                <label>Reps</label>
                <input
                  aria-label={`Reps pour série ${index + 1}`}
                  type="number"
                  value={set.reps}
                  onChange={(e) => onInputChange(e.target.value, 'reps', index)}
                />
              </div>
              <div className="set-input">
                <label>RIR</label>
                <input
                  aria-label={`RIR pour série ${index + 1}`}
                  type="number"
                  value={set.rir}
                  onChange={(e) => onInputChange(e.target.value, 'rir', index)}
                />
              </div>
              <button
                aria-label={`Valider série ${index + 1}`}
                className={`set-check-btn ${set.completed ? 'completed' : ''}`}
                onClick={() => handleCheck(set, index)}
              >
                ✓
              </button>
            </div>
          );
        })}
      </div>
      {renderIntensificationGuide(baseExercise)}
    </div>
  );
};

interface ActiveWorkoutMeta {
  week: number;
  day: string;
  isHomeWorkout: boolean;
}

interface ActiveWorkoutState {
  workout: WorkoutTemplate;
  meta: ActiveWorkoutMeta;
  startTime: number;
}

interface ActiveWorkoutViewProps {
  workout: WorkoutTemplate;
  meta: ActiveWorkoutMeta;
  onEndWorkout: (completedWorkout: { exercises: CompletedWorkoutExercise[] }) => void;
  getSuggestedWeight: (exercise: BaseExerciseTemplate | SupersetExerciseTemplate | HomeWorkoutTemplate) => number;
}


const ActiveWorkoutView = ({ workout, meta, onEndWorkout, getSuggestedWeight }: ActiveWorkoutViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTime, setRestTime] = useState(0);

  // Fix: Explicitly type the arguments and return value of the map callback
  const [workoutState, setWorkoutState] = useState<CompletedWorkoutExercise[]>(() =>
    workout.exercises.map((exoTemplate: ProgramExerciseTemplate): CompletedWorkoutExercise => {
      if (isProgramSupersetBlockTemplate(exoTemplate)) {
        // For superset, determine the maximum number of sets across its exercises
        const numSets = Math.max(...exoTemplate.exercises.map(e => e.sets));
        return {
          ...exoTemplate, // This maintains the original properties of SupersetBlockTemplate
          exercises: exoTemplate.exercises.map((subExoTemplate: SupersetExerciseTemplate): CompletedSupersetExercise => ({
            ...subExoTemplate, // This maintains the original properties of SupersetExerciseTemplate
            sets: Array.from({ length: numSets }, (_, i) => ({
              id: `${subExoTemplate.id}-${i}-${Math.random()}`, // Unique ID for each set
              weight: getSuggestedWeight(subExoTemplate) || '', // Pass subExoTemplate directly
              reps: (subExoTemplate.reps || "8").toString().split('-')[0], // Take the lower bound of reps
              rir: subExoTemplate.rir || 1,
              completed: false,
            })),
          })),
        } as CompletedSupersetBlock; // Explicit cast for the block
      }
      const baseExoTemplate: BaseExerciseTemplate = exoTemplate; // Ensure it's treated as BaseExerciseTemplate for getSuggestedWeight
      return {
        ...baseExoTemplate, // This maintains the original properties of BaseExerciseTemplate
        sets: Array.from({ length: baseExoTemplate.sets }, (_, i) => ({
          id: `${baseExoTemplate.id}-${i}-${Math.random()}`, // Unique ID for each set
          weight: getSuggestedWeight(baseExoTemplate) || '', // Pass baseExoTemplate directly
          reps: (baseExoTemplate.reps || "8").toString().split('-')[0],
          rir: baseExoTemplate.rir || 1,
          completed: false,
        })),
      } as CompletedBaseExercise; // Explicit cast for the base exercise
    })
  );

  const currentExercise = workoutState[currentIndex];
  const currentBlock = useMemo(() => programData.blocks.find(b => b.weeks.includes(meta.week)) || { id: 0, name: "Phase Initiale", weeks: [], technique: { name: "Technique", desc: "Concentration sur la forme." } }, [meta.week]);

  // Determine active set index for the current exercise
  const isSupersetBlock = isCompletedSupersetBlock(currentExercise);
  const setsForActiveCheck = isSupersetBlock ?
    currentExercise.exercises[0].sets : // Assuming all exercises in a superset have the same number of sets
    currentExercise.sets;
  const firstIncompleteSet = setsForActiveCheck.findIndex(s => !s.completed);
  const activeSetIndex = firstIncompleteSet === -1 ? setsForActiveCheck.length : firstIncompleteSet;

  const handleSetComplete = useCallback((isCompleted: boolean, setIndex: number, subExoIndex: number = -1) => {
    setWorkoutState(current => {
      const newState = JSON.parse(JSON.stringify(current)) as CompletedWorkoutExercise[];
      const exo = newState[currentIndex];
      
      let set: CompletedSet;
      let targetExoForRestCheck: CompletedBaseExercise | CompletedSupersetBlock;

      if (isCompletedSupersetBlock(exo)) {
        const supersetBlock = exo;
        if (subExoIndex > -1) {
          set = supersetBlock.exercises[subExoIndex].sets[setIndex];
        } else {
          // If no subExoIndex is provided, it means the entire superset set is being toggled
          // For rest purposes, we will check all exercises in the superset
          set = supersetBlock.exercises[0].sets[setIndex]; // Just pick one to update `completed` status for rest trigger
        }
        targetExoForRestCheck = supersetBlock;
      } else {
        const baseExercise = exo;
        set = baseExercise.sets[setIndex];
        targetExoForRestCheck = baseExercise;
      }

      set.completed = isCompleted;

      // Trigger rest timer
      if (isCompleted && targetExoForRestCheck.rest) {
        if (isCompletedSupersetBlock(targetExoForRestCheck)) {
          // For supersets, all exercises in the current set must be completed to trigger rest
          if (targetExoForRestCheck.exercises.every(e => e.sets[setIndex]?.completed)) {
            setRestTime(targetExoForRestCheck.rest);
            setIsResting(true);
          }
        } else {
          // For regular exercises, completing a set triggers rest
          setRestTime(targetExoForRestCheck.rest);
          setIsResting(true);
        }
      }

      return newState;
    });
  }, [currentIndex]);


  const handleInputChange = (value: string, field: 'weight' | 'reps' | 'rir', setIndex: number, subExoIndex: number = -1) => {
    const newWorkoutState = JSON.parse(JSON.stringify(workoutState)) as CompletedWorkoutExercise[];
    
    let targetSetContainer: CompletedBaseExercise | CompletedSupersetExercise;

    if (isCompletedSupersetBlock(newWorkoutState[currentIndex])) {
        targetSetContainer = newWorkoutState[currentIndex].exercises[subExoIndex];
    } else {
        targetSetContainer = newWorkoutState[currentIndex] as CompletedBaseExercise;
    }
    
    targetSetContainer.sets[setIndex][field] = value;
    setWorkoutState(newWorkoutState);
  };

  const handleAddBonusSet = (newSet: Omit<CompletedSet, 'id' | 'completed'>, subExoIndex: number = -1) => {
    const newWorkoutState = [...workoutState];
    let targetExo: CompletedBaseExercise | CompletedSupersetExercise;

    if (isCompletedSupersetBlock(newWorkoutState[currentIndex])) {
      targetExo = newWorkoutState[currentIndex].exercises[subExoIndex];
    } else {
      targetExo = newWorkoutState[currentIndex] as CompletedBaseExercise;
    }

    targetExo.sets.push({ id: `bonus-${targetExo.id}-${targetExo.sets.length}`, weight: '', reps: '', rir: 0, ...newSet, completed: false, isBonus: true });
    setWorkoutState(newWorkoutState);
  };


  return (
    <div className="main-content">
      <div className="workout-header">
        <span className="workout-progress">{currentIndex + 1} / {workoutState.length}</span>
        <button className="end-workout-btn" onClick={() => onEndWorkout({ exercises: workoutState })}>
          Terminer
        </button>
      </div>

      <div className="current-exercise-info">
        <h2>
          {isSupersetBlock ?
            currentExercise.exercises.map(e => e.name).join(' + ') :
            currentExercise.name
          }
        </h2>
      </div>

      <TechniqueHighlight exercise={currentExercise} block={currentBlock} />

      <SetsTracker
        exercise={currentExercise}
        onSetComplete={handleSetComplete}
        onInputChange={handleInputChange}
        onAddBonusSet={handleAddBonusSet}
        block={currentBlock}
        activeSetIndex={activeSetIndex}
      />

      <div className="workout-navigation">
        <button onClick={() => setCurrentIndex(i => i - 1)} disabled={currentIndex === 0}>Précédent</button>
        <button onClick={() => setCurrentIndex(i => i + 1)} disabled={currentIndex === workoutState.length - 1}>Suivant</button>
      </div>

      {isResting && (
        <CircularRestTimer
          duration={restTime}
          onFinish={() => setIsResting(false)}
          currentExerciseName={isSupersetBlock ?
            currentExercise.exercises.map(e => e.name).join(' + ') :
            currentExercise.name
          }
          nextSetInfo={`Set ${activeSetIndex + 1}/${setsForActiveCheck.length}`}
        />
      )}
    </div>
  );
};


interface SegmentedControlProps {
  options: { label: string; value: string }[];
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

const SegmentedControl = ({ options, selected, onChange, className }: SegmentedControlProps) => {
  return (
    <div className={`segmented-control ${className || ''}`}>
      {options.map(option => (
        <button
          key={option.value}
          className={selected === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

interface KPICardsProps {
  stats: {
    totalWorkouts: number;
    totalVolume: number;
    totalSets: number;
  };
}

const KPICards = ({ stats }: KPICardsProps) => {
  const kpis = [
    { label: 'Séances', value: stats.totalWorkouts, icon: <WorkoutIcon /> },
    { label: 'Volume (kg)', value: Math.round(stats.totalVolume).toLocaleString('fr-FR'), icon: <WeightIcon /> },
    { label: 'Séries', value: stats.totalSets, icon: <SetsIcon /> }
  ];

  return (
    <div className="kpi-grid">
      {kpis.map(kpi => (
        <div className="kpi-card" key={kpi.label}>
          {kpi.icon}
          <div className="kpi-value">{kpi.value}</div>
          <div className="kpi-label">{kpi.label}</div>
        </div>
      ))}
    </div>
  );
};

const SevenDayStreak = ({ history }: { history: WorkoutHistory }) => {
  const today = new Date();
  // Get the last 7 days, including today
  const days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - (6 - i)); // 6 days ago, 5 days ago, ..., today
    return date;
  });

  const trainedDays = useMemo(() => {
    const dates = new Set<string>();
    Object.values(history).forEach((w) => {
      dates.add(new Date(w.date).toDateString());
    });
    return dates;
  }, [history]);

  return (
    <div className="seven-day-streak">
      <div className="streak-header">
        <span>7-Day Streak</span>
        {/* Potentially add current streak count here */}
      </div>
      <div className="streak-days">
        {days.map((day, i) => (
          <div className="streak-day" key={i}>
            <span className="day-label">{day.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)}</span>
            <div className={`day-circle ${trainedDays.has(day.toDateString()) ? 'trained' : ''}`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const AnatomyChart = ({ history }: { history: WorkoutHistory }) => {
  const [view, setView] = useState<'front' | 'back'>('front');

  const workedMusclesLast7Days = useMemo(() => {
    const muscles = new Set<string>();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    Object.values(history).forEach((workout) => {
      if (new Date(workout.date) >= sevenDaysAgo) {
        workout.exercises.forEach((exo: CompletedWorkoutExercise) => { // Explicitly type exo here
          const processMuscle = (subExo: CompletedBaseExercise | CompletedSupersetExercise) => {
            if (subExo.muscles) {
              subExo.muscles.primary.forEach(m => muscles.add(m));
              subExo.muscles.secondary.forEach(m => muscles.add(m));
            }
          };
          if (isCompletedSupersetBlock(exo)) {
            // Fix: Iterate over all exercises in the superset block for comprehensive muscle tracking.
            exo.exercises.forEach(subExoInSuperset => processMuscle(subExoInSuperset));
          } else {
            processMuscle(exo as CompletedBaseExercise); // exo is CompletedBaseExercise here
          }
        });
      }
    });
    return muscles;
  }, [history]);


  // Simplified SVG paths for muscle groups (conceptual)
  // These paths would ideally be much more detailed and accurate
  const muscleMapping: Record<string, string> = {
    Pectoraux: 'chest',
    Dos: 'back',
    Quadriceps: 'quads',
    Ischios: 'hamstrings',
    Fessiers: 'glutes',
    Épaules: 'shoulders',
    Biceps: 'biceps',
    Triceps: 'triceps',
    'Avant-bras': 'forearms',
    Mollets: 'calves'
  };


  const frontMuscles = {
    shoulders: { d: "M65,95 C45,100 40,120 40,130 L35,160 L60,150 L65,110 Z M135,95 C155,100 160,120 160,130 L165,160 L140,150 L135,110 Z" },
    chest: { d: "M65,110 L60,150 L100,160 L100,110 Z M135,110 L140,150 L100,160 L100,110 Z" },
    biceps: { d: "M35,160 L60,150 L60,190 L35,190 Z M165,160 L140,150 L140,190 L165,190 Z" },
    forearms: { d: "M35,190 L60,190 L60,230 L35,230 Z M165,190 L140,190 L140,230 L165,230 Z" },
    quads: { d: "M60,240 L100,240 L100,350 L60,350 Z M100,240 L140,240 L140,350 L100,350 Z" },
    abdominals: { d: "M60,160 L140,160 L140,240 L60,240 Z" }
    // Add more front muscles here
  };

  const backMuscles = {
    shoulders: { d: "M65,95 C45,100 40,120 40,130 L35,160 L60,150 L65,110 Z M135,95 C155,100 160,120 160,130 L165,160 L140,150 L135,110 Z" },
    back: { d: "M65,110 L135,110 L140,230 L60,230 Z" },
    triceps: { d: "M35,160 L60,150 L60,190 L35,190 Z M165,160 L140,150 L140,190 L165,190 Z" },
    forearms: { d: "M35,190 L60,190 L60,230 L35,230 Z M165,190 L140,190 L140,230 L165,230 Z" },
    glutes: { d: "M60,230 L140,230 L140,280 L60,280 Z" },
    hamstrings: { d: "M60,280 L100,280 L100,350 L60,350 Z M100,280 L140,280 L140,350 L100,350 Z" }
    // Add more back muscles here
  };


  const isMuscleWorked = (muscleName: string | undefined) => {
    return muscleName ? workedMusclesLast7Days.has(muscleName) : false;
  };

  const renderPaths = (muscleSet: typeof frontMuscles | typeof backMuscles) => {
    return Object.entries(muscleSet).map(([name, data]) => {
      // Find the French muscle group name from muscleMapping
      const muscleGroupName = Object.keys(muscleMapping).find(key => muscleMapping[key] === name);
      const isWorked = isMuscleWorked(muscleGroupName);
      return <path key={name} d={data.d} className={isWorked ? 'worked' : ''} />;
    });
  };

  return (
    <div className='anatomy-container'>
      <button className='anatomy-toggle' onClick={() => setView(v => v === 'front' ? 'back' : 'front')} aria-label="Basculer la vue anatomique">
        <ArrowPathIcon />
      </button>
      <div className='anatomy-chart'>
        <div className='anatomy-view'>
          <svg viewBox="0 0 200 450" role="img" aria-labelledby="anatomy-chart-title">
            <title id="anatomy-chart-title">{`Muscles sollicités - vue ${view === 'front' ? 'avant' : 'arrière'}`}</title>
            {view === 'front' ? renderPaths(frontMuscles) : renderPaths(backMuscles)}
          </svg>
        </div>
      </div>
    </div>
  );
};


interface MuscleRadarChartProps {
  currentStats: Record<string, number>;
  previousStats: Record<string, number>;
}

const MuscleRadarChart = ({ currentStats, previousStats }: MuscleRadarChartProps) => {
  const radarMuscles = ["Pectoraux", "Dos", "Épaules", "Quadriceps", "Ischios", "Biceps", "Triceps"]; // Muscle groups to display on radar

  const size = 300; // SVG size
  const center = size / 2;
  const radius = size * 0.4; // Max radius for the radar points

  const calculatePoints = (stats: Record<string, number>) => {
    // Determine max value across both periods to normalize scale
    const allStatsValues = [...Object.values(currentStats), ...Object.values(previousStats)];
    const maxVal = Math.max(...allStatsValues.filter(val => typeof val === 'number') as number[], 1); // Ensure maxVal is at least 1 to avoid division by zero

    return radarMuscles.map((muscle, i) => {
      const angle = (i / radarMuscles.length) * 2 * Math.PI - Math.PI / 2; // -Math.PI/2 to start from top
      const value = stats[muscle] || 0;
      const r = (value / maxVal) * radius; // Scale value to radius

      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  };

  const currentPoints = calculatePoints(currentStats);
  const previousPoints = calculatePoints(previousStats);

  return (
    <div className="radar-chart-container">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-labelledby="radar-chart-title">
        <title id="radar-chart-title">Répartition musculaire (current vs previous)</title>
        {/* Axes and labels */}
        {radarMuscles.map((muscle, i) => {
          const angle = (i / radarMuscles.length) * 2 * Math.PI - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          const labelX = center + (radius + 20) * Math.cos(angle); // Position labels slightly outside the circle
          const labelY = center + (radius + 20) * Math.sin(angle);

          return (
            <g key={muscle}>
              <line className="radar-axis" x1={center} y1={center} x2={x2} y2={y2} />
              <text className="radar-label" x={labelX} y={labelY} dy="0.33em">
                {muscle.substring(0, 4)} {/* Abbreviate muscle names if too long */}
              </text>
            </g>
          );
        })}

        {/* Polygons for data */}
        <polygon className="radar-polygon-previous" points={previousPoints} />
        <polygon className="radar-polygon-current" points={currentPoints} />
      </svg>
    </div>
  );
};


interface MuscleVolumeTrendChartProps {
  history: WorkoutHistory;
}

const MuscleVolumeTrendChart = ({ history }: MuscleVolumeTrendChartProps) => {
  const [granularity, setGranularity] = useState<'week' | 'month'>('week');
  const [visibleMuscles, setVisibleMuscles] = useState<string[]>(muscleGroups);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: MuscleVolumeTrendDataPoint } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Define a consistent color palette for muscle groups
  const muscleColors = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#AF52DE', '#5E5CE6', '#64D2FF', '#FFD60A', '#A2845E'];


  const toggleMuscleVisibility = (muscle: string) => {
    setVisibleMuscles(current =>
      current.includes(muscle) ? current.filter(m => m !== muscle) : [...current, muscle]
    );
  };

  const trendData: MuscleVolumeTrendDataPoint[] = useMemo(() => {
    const sortedHistory = Object.values(history).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sortedHistory.length === 0) return [];

    const dataMap = new Map<string, MuscleVolumeTrendDataPoint>();

    sortedHistory.forEach((workout) => {
      const date = new Date(workout.date);
      let key: string; // Key for the week or month
      
      if (granularity === 'week') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay()); // Adjust to Sunday of the week
        key = startOfWeek.toISOString().split('T')[0];
      } else { // Month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!dataMap.has(key)) {
        const initialCounts: Record<string, number> = {};
        muscleGroups.forEach(m => initialCounts[m] = 0);
        dataMap.set(key, { date: date, ...initialCounts });
      }

      const periodData = dataMap.get(key)!;
      workout.exercises.forEach((exo: CompletedWorkoutExercise) => { // Explicitly type exo here
        const processExo = (subExo: CompletedBaseExercise | CompletedSupersetExercise) => {
          if (subExo.muscles) {
            subExo.muscles.primary.forEach(m => {
              // Count completed sets as a proxy for volume
              periodData[m] = (periodData[m] as number) + (subExo.sets || []).filter(s => s.completed).length;
            });
          }
        };
        if (isCompletedSupersetBlock(exo)) {
          // Fix: Iterate over all exercises in the superset block for comprehensive muscle tracking.
          exo.exercises.forEach(subExoInSuperset => processExo(subExoInSuperset));
        } else {
          processExo(exo as CompletedBaseExercise);
        }
      });
    });
    return Array.from(dataMap.values());
  }, [history, granularity]);

  if (trendData.length < 2) {
    return <p className="empty-stat-small">Pas assez de données pour afficher une tendance.</p>;
  }

  const margin = { top: 20, right: 20, bottom: 30, left: 35 };
  const width = 350 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;

  const maxSets = Math.max(...trendData.flatMap(d => Object.values(d).filter(val => typeof val === 'number') as number[]), 1);
  const dates = trendData.map(d => d.date);

  const minDate = dates[0].getTime();
  const maxDate = dates[dates.length - 1].getTime();
  const dateRange = maxDate - minDate === 0 ? 1 : maxDate - minDate;

  const getX = (date: Date) => ((date.getTime() - minDate) / dateRange) * width;
  const getY = (sets: number) => height - ((sets / maxSets) * height);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = containerRef.current?.querySelector('svg');
    if (!svg) return;

    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;

    // Transform mouse client coordinates to SVG coordinates
    const cursorPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse() || new DOMMatrix());
    const xPos = cursorPoint.x - margin.left;

    // Find the closest data point based on x position
    const closestPoint = trendData.reduce((prev, curr) =>
      Math.abs(getX(curr.date) - xPos) < Math.abs(getX(prev.date) - xPos) ? curr : prev
    );

    setTooltip({
      x: getX(closestPoint.date) + margin.left,
      y: e.nativeEvent.offsetY - 20, // Adjust tooltip Y position
      content: closestPoint,
    });
  };

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div>
      <div className="progression-chart-container" ref={containerRef} onMouseLeave={handleMouseLeave}>
        <svg
          className="progression-chart-svg"
          viewBox={`0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`}
          onMouseMove={handleMouseMove}
          role="img" aria-labelledby="volume-trend-chart-title"
        >
          <title id="volume-trend-chart-title">Évolution du volume musculaire par {granularity}</title>
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Y-axis grid lines */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = height * (i / 4);
              return <line key={i} className="grid-line" x1={0} x2={width} y1={y} y2={y} />;
            })}
            {/* Y-axis labels for max and min sets */}
            <text className="axis-label" x={-5} y={-5} textAnchor='end'>{maxSets}</text>
            <text className="axis-label" x={-5} y={height + 3} textAnchor='end'>{0}</text>

            {/* Data lines for each muscle group */}
            {muscleGroups.map((muscle, i) => {
              if (!visibleMuscles.includes(muscle)) return null;
              const path = trendData.map((p, j) =>
                `${j === 0 ? 'M' : 'L'} ${getX(p.date)} ${getY(p[muscle] as number)}`
              ).join(' ');
              return <path key={muscle} className="data-line" d={path} stroke={muscleColors[i]} />;
            })}
            {/* Tooltip line */}
            {tooltip && (
              <line
                stroke="var(--color-text-secondary)"
                strokeWidth="1"
                strokeDasharray="3 3"
                x1={tooltip.x - margin.left}
                y1={0}
                x2={tooltip.x - margin.left}
                y2={height}
              />
            )}
          </g>
        </svg>
        {tooltip && (
          <div className="chart-tooltip visible" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
            <strong>{tooltip.content.date.toLocaleDateString('fr-FR')}</strong>
            {Object.entries(tooltip.content).filter(([key]) => key !== 'date' && visibleMuscles.includes(key)).map(([key, value]) => (
              <div key={key}>{`${key}: ${value}`}</div>
            ))}
          </div>
        )}
      </div>

      <div className="stat-card-header">
        <h3>Volume par Muscle</h3>
        <SegmentedControl
          options={[{ label: 'Semaine', value: 'week' }, { label: 'Mois', value: 'month' }]}
          selected={granularity}
          onChange={(value) => setGranularity(value as 'week' | 'month')}
        />
      </div>

      <div className="muscle-trend-legend">
        {muscleGroups.map((muscle, i) => (
          <div
            key={muscle}
            className={`legend-item ${visibleMuscles.includes(muscle) ? '' : 'inactive'}`}
            onClick={() => toggleMuscleVisibility(muscle)}
          >
            <div className="legend-color-dot" style={{ backgroundColor: muscleColors[i] }}></div>
            {muscle}
          </div>
        ))}
      </div>
    </div>
  );
};



interface StatisticsViewProps {
  onSelectExercise: (exerciseId: string) => void;
  getExercisePR: (exerciseId: string) => { weight: number; reps: number };
  history: WorkoutHistory;
}

const StatisticsView = ({ onSelectExercise, getExercisePR, history }: StatisticsViewProps) => {
  const [timeFilter, setTimeFilter] = useState<'30d' | '90d' | 'all'>('30d');
  const hasHistory = Object.keys(history).length > 0;

  const { currentPeriodStats, previousPeriodStats } = useMemo(() => {
    const calculateStats = (historySlice: CompletedWorkout[]) => {
      const stats = {
        totalWorkouts: 0,
        totalVolume: 0,
        totalSets: 0,
        muscleDistribution: {} as Record<string, number>,
      };

      historySlice.forEach((workout) => {
        stats.totalWorkouts++;
        (workout.exercises || []).forEach((exo: CompletedWorkoutExercise) => {
          const processExo = (subExo: CompletedBaseExercise | CompletedSupersetExercise) => {
            const completedSets = (subExo.sets || []).filter(s => s.completed);
            completedSets.forEach(set => {
              stats.totalSets++;
              stats.totalVolume += (parseFloat(String(set.weight)) || 0) * (parseInt(String(set.reps)) || 0);
            });
            if (subExo.muscles) {
              (subExo.muscles.primary || []).forEach(m => {
                stats.muscleDistribution[m] = (stats.muscleDistribution[m] || 0) + completedSets.length;
              });
            }
          };
          if (isCompletedSupersetBlock(exo)) (exo.exercises || []).forEach(processExo);
          else processExo(exo as CompletedBaseExercise);
        });
      });
      return stats;
    };

    if (timeFilter === 'all') {
      const allHistory = Object.values(history);
      return { currentPeriodStats: calculateStats(allHistory), previousPeriodStats: calculateStats([]) }; // No "previous" for "all time"
    }

    const now = new Date();
    const daysToSubtract = timeFilter === '30d' ? 30 : 90;
    
    const currentCutoff = new Date(new Date().setDate(now.getDate() - daysToSubtract));
    const previousCutoff = new Date(new Date().setDate(now.getDate() - (daysToSubtract * 2)));

    const currentPeriodHistory = Object.values(history).filter((w) => new Date(w.date) >= currentCutoff);
    const previousPeriodHistory = Object.values(history).filter((w) => {
      const date = new Date(w.date);
      return date >= previousCutoff && date < currentCutoff;
    });

    return {
      currentPeriodStats: calculateStats(currentPeriodHistory),
      previousPeriodStats: calculateStats(previousPeriodHistory)
    };
  }, [history, timeFilter]);

  if (!hasHistory) {
    return (
      <div className="main-content">
        <div className="empty-stat">
          Commencez à vous entraîner pour voir vos statistiques.
        </div>
      </div>
    );
  }

  return (
    <div className="main-content">
      <h2 className="stats-header">Tableau de Bord</h2>
      <SegmentedControl
        options={[
          { label: '30 Jours', value: '30d' },
          { label: '90 Jours', value: '90d' },
          { label: 'Tout', value: 'all' }
        ]}
        selected={timeFilter}
        onChange={(value) => setTimeFilter(value as '30d' | '90d' | 'all')}
        className='main-filter'
      />

      <div className="stats-dashboard">
        <div className="stat-card">
          <h3>Vue d'overview</h3>
          <KPICards stats={currentPeriodStats} />
          <SevenDayStreak history={history} />
        </div>
        <div className="stat-card">
          <h3>Muscles Sollicités (7 derniers jours)</h3>
          <AnatomyChart history={history} />
        </div>
        <div className="stat-card">
          <h3>Répartition Musculaire</h3>
          <MuscleRadarChart currentStats={currentPeriodStats.muscleDistribution} previousStats={previousPeriodStats.muscleDistribution} />
        </div>
        <div className="stat-card">
          <MuscleVolumeTrendChart history={history} />
        </div>
        <div className="stat-card">
          <h3>Progression des Charges</h3>
          {programData.stats.projections.map(exo => (
            <div
              key={exo.id}
              className="stat-card clickable"
              onClick={() => onSelectExercise(exo.id)}
            >
              <h4>{exo.name}</h4>
              <ProgressionChart exerciseId={exo.id} exerciseName={exo.name} history={history} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


interface PRCardProps {
  label: string;
  value: number;
  unit: string;
}

const PRCard = ({ label, value, unit }: PRCardProps) => {
  return (
    <div className="pr-card">
      <div className="pr-value">{value} {unit}</div>
      <div className="pr-label">{label}</div>
    </div>
  );
};

interface ExerciseHistoryListProps {
  exerciseHistory: { date: Date; sets: { weight: number; reps: number; rir: number }[] }[];
}

const ExerciseHistoryList = ({ exerciseHistory }: ExerciseHistoryListProps) => {
  if (!exerciseHistory || exerciseHistory.length === 0) {
    return <p className="empty-stat-small">Aucun historique trouvé pour cet exercice.</p>;
  }

  return (
    <div className="exercise-history-list">
      {exerciseHistory.map((workoutEntry, index) => (
        <div className="history-workout-item" key={index}>
          <div className="date">
            {workoutEntry.date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {workoutEntry.sets.map((set, setIndex) => (
            <div className="history-set-item" key={setIndex}>
              <span className="set-details">{set.weight} kg x {set.reps}</span>
              <span className="rir">RIR {set.rir}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};


interface ExerciseDetailViewProps {
  exerciseId: string;
  onBack: () => void;
  history: WorkoutHistory;
  getExercisePR: (exerciseId: string) => { weight: number; reps: number };
  getBestSetVolume: (exerciseId: string) => number;
  getMostReps: (exerciseId: string) => number;
  getProjected1RM: (exerciseId: string) => number;
  getWorkoutHistoryForExercise: (exerciseId: string) => { date: Date; sets: { weight: number; reps: number; rir: number }[] }[];
}

const ExerciseDetailView = ({
  exerciseId,
  onBack,
  history,
  getExercisePR,
  getBestSetVolume,
  getMostReps,
  getProjected1RM,
  getWorkoutHistoryForExercise
}: ExerciseDetailViewProps) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'history'>('summary');

  // Find the exercise details from programData
  const exercise = useMemo(() => {
    for (const day in programData.workouts) {
      for (const exo of programData.workouts[day].exercises) {
        if (isProgramSupersetBlockTemplate(exo)) {
          const subExo = exo.exercises.find(e => e.id === exerciseId);
          if (subExo) return subExo;
        } else if (exo.id === exerciseId) {
          return exo;
        }
      }
    }
    return null;
  }, [exerciseId]);

  const exerciseName = exercise ? exercise.name : 'Exercice Inconnu';

  const exerciseHistory = useMemo(() => getWorkoutHistoryForExercise(exerciseId), [exerciseId, getWorkoutHistoryForExercise]);

  return (
    <div className="exercise-detail-view">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack} aria-label="Retour au tableau de bord">
          <ChevronLeftIcon />
        </button>
        <h2 className="detail-title">{exerciseName}</h2>
      </div>

      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Résumé
        </button>
        <button
          className={`detail-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historique
        </button>
      </div>

      <div className="detail-content">
        {activeTab === 'summary' && (
          <>
            <div className="stat-card">
              <h3>Progression des Charges</h3>
              <ProgressionChart exerciseId={exerciseId} exerciseName={exerciseName} history={history} />
            </div>
            <div className="pr-section">
              <h3>Records Personnels</h3>
              <div className="pr-grid">
                <PRCard label="Poids le + Lourd" value={getExercisePR(exerciseId).weight} unit="kg" />
                <PRCard label="1RM Projeté" value={getProjected1RM(exerciseId)} unit="kg" />
                <PRCard label="Meilleure Série" value={getBestSetVolume(exerciseId)} unit="kg" />
                <PRCard label="+ de Répétitions" value={getMostReps(exerciseId)} unit="reps" />
              </div>
            </div>
          </>
        )}
        {activeTab === 'history' && (
          <ExerciseHistoryList exerciseHistory={exerciseHistory} />
        )}
      </div>
    </div>
  );
};


interface ExerciseCardProps {
  exercise: ProgramExerciseTemplate;
}

const ExerciseCard = ({ exercise }: ExerciseCardProps) => {
  if (isProgramSupersetBlockTemplate(exercise)) {
    const supersetBlock = exercise as SupersetBlockTemplate;
    const firstExercise = supersetBlock.exercises.length > 0 ? supersetBlock.exercises[0] : null;
    const secondExercise = supersetBlock.exercises.length > 1 ? supersetBlock.exercises[1] : null;

    return (
      <div className="superset-card">
        <div className="superset-badge">SUPERSET</div>
        <div className="superset-exercises">
          {firstExercise && (
            <>
              <div className="superset-exercise-item">
                <h4>{firstExercise.name}</h4>
                <div className="sets-reps">{firstExercise.sets} × {firstExercise.reps}</div>
              </div>
              {secondExercise && <div className="superset-plus-icon"><PlusIcon /></div>}
              {secondExercise && (
                <div className="superset-exercise-item">
                  <h4>{secondExercise.name}</h4>
                  <div className="sets-reps">{secondExercise.sets} × {secondExercise.reps}</div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="exercise-details">
          Repos: {supersetBlock.rest}s après le duo
        </div>
      </div>
    );
  }

  const baseExercise = exercise as BaseExerciseTemplate;
  return (
    <div className="exercise-card">
      <div className="exercise-header">
        <h4>{baseExercise.name}</h4>
        <div className="sets-reps">{baseExercise.sets} × {baseExercise.reps}</div>
      </div>
      <div className="exercise-details">
        <span>RIR {baseExercise.rir} | Repos: {baseExercise.rest}s</span>
      </div>
    </div>
  );
};


interface WorkoutPlannerViewProps {
  onStartWorkout: (workout: WorkoutTemplate, week: number, day: string, isHomeWorkout?: boolean) => void;
}

const WorkoutPlannerView = ({ onStartWorkout }: WorkoutPlannerViewProps) => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(() => {
    // Set initial active day based on current day of the week
    const dayIndex = new Date().getDay(); // 0 for Sunday, 1 for Monday, etc.
    const dayMap: { [key: number]: string } = {
      0: 'dimanche', // Sunday
      2: 'mardi',    // Tuesday
      4: 'jeudi',    // Thursday - assuming this day has a home workout only in programData
      5: 'vendredi'  // Friday
    };
    // Default to 'dimanche' if current day is not in map (e.g., Monday, Wednesday, Saturday)
    return dayMap[dayIndex] || 'dimanche'; 
  });

  const { currentBlock, isDeload } = useMemo(() => {
    if (programData.deloadWeeks.includes(currentWeek)) {
      return { isDeload: true, currentBlock: { id: -1, name: `SEMAINE ${currentWeek}: DELOAD`, weeks: [], technique: { name: "Récupération", desc: "Charges réduites, RPE 5-6." } } };
    }
    const block = programData.blocks.find(b => b.weeks.includes(currentWeek)) || { id: 0, name: "Phase Initiale", weeks: [], technique: { name: "Technique", desc: "Concentration sur la forme." } };
    return { isDeload: false, currentBlock: block };
  }, [currentWeek]);

  const gymWorkout = useMemo(() => {
    const originalWorkout = programData.workouts[activeDay];
    if (!originalWorkout) return null;

    // Deep copy to allow modifications
    let workout = JSON.parse(JSON.stringify(originalWorkout)) as WorkoutTemplate;

    // Logic for biceps exercise rotation
    const getBicepsName = (w: number) => {
      const b = programData.blocks.find(bl => bl.weeks.includes(w))?.id;
      return (b === 1 || b === 3) ? 'Incline Curl' : 'Spider Curl';
    };

    workout.exercises.forEach((exo) => {
      if (isProgramSupersetBlockTemplate(exo)) {
        const supersetBlock = exo as SupersetBlockTemplate;
        supersetBlock.exercises.forEach((subExo) => {
          if (subExo.bicepsRotation) {
            subExo.name = getBicepsName(currentWeek);
          }
        });
      } else if (isProgramBaseExerciseTemplate(exo)) {
        const baseExercise = exo as BaseExerciseTemplate;
        if (baseExercise.bicepsRotation) {
          baseExercise.name = getBicepsName(currentWeek);
        }
      }
    });

    return workout;
  }, [activeDay, currentWeek]);

  const homeWorkout = programData.homeWorkouts[activeDay];

  return (
    <div className="main-content">
      <header className="header">
        <h1>Programme d'Entraînement</h1>
      </header>

      <div className="week-navigator">
        <button onClick={() => setCurrentWeek(w => Math.max(1, w - 1))} disabled={currentWeek === 1} aria-label="Semaine précédente">
          &lt;
        </button>
        <div className="week-display">Semaine {currentWeek}</div>
        <button onClick={() => setCurrentWeek(w => Math.min(26, w + 1))} disabled={currentWeek === 26} aria-label="Semaine suivante">
          &gt;
        </button>
      </div>

      <div className="block-info">
        <h3>{currentBlock.name}</h3>
        <p><strong>Technique :</strong> {currentBlock.technique.desc}</p>
      </div>

      <div className="tabs">
        {['dimanche', 'mardi', 'jeudi', 'vendredi'].map(day => (
          <button
            key={day}
            className={`tab ${activeDay === day ? 'active' : ''}`}
            onClick={() => setActiveDay(day)}
            aria-selected={activeDay === day}
          >
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </button>
        ))}
      </div>

      <MuscleGroupHeatmap workout={gymWorkout || (homeWorkout ? { name: "Séance Maison", exercises: [homeWorkout] } as WorkoutTemplate : null)} />


      <div className="workout-overview">
        {gymWorkout && (
          <>
            <button
              className="start-session-btn"
              onClick={() => onStartWorkout(gymWorkout, currentWeek, activeDay)}
              disabled={isDeload}
            >
              {isDeload ? 'Jour de repos / Deload' : `Commencer - ${gymWorkout.name}`}
            </button>
            {gymWorkout.exercises.map((exo, index) => (
              <ExerciseCard key={exo.id || `superset-${index}`} exercise={exo} />
            ))}
          </>
        )}

        {homeWorkout && (
          <div className="home-workout-card">
            <div>
              <h4>🏠 Séance à la Maison</h4>
              <p>{homeWorkout.name} - {homeWorkout.sets} × {homeWorkout.reps}</p>
            </div>
            <button className="start-home-btn" onClick={() => onStartWorkout({ name: "Séance Maison", exercises: [homeWorkout] }, currentWeek, activeDay, true)}>
              Démarrer
            </button>
          </div>
        )}

        {/* Display message for Thursday if only home workout */}
        {!gymWorkout && activeDay === 'jeudi' && <p style={{ textAlign: 'center', marginTop: '2rem' }}>Séance à la maison uniquement aujourd'hui.</p>}

        {/* Display message for rest days (no gym or home workout defined for the day) */}
        {!gymWorkout && !homeWorkout && !programData.homeWorkouts[activeDay] && (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>Jour de repos.</p>
        )}
      </div>
    </div>
  );
};


interface BottomNavProps {
  currentView: 'program' | 'stats';
  setView: (view: 'program' | 'stats') => void;
}

const BottomNav = ({ currentView, setView }: BottomNavProps) => (
  <nav className="bottom-nav">
    <button className={`nav-item ${currentView === 'stats' ? 'active' : ''}`} onClick={() => setView('stats')}>
      <ChartIcon />
      <span>Stats</span>
    </button>
    <button className={`nav-item ${currentView === 'program' ? 'active' : ''}`} onClick={() => setView('program')}>
      <DumbbellIcon />
      <span>Programme</span>
    </button>
  </nav>
);

const App = () => {
  const [currentView, setCurrentView] = useState<'program' | 'stats'>('stats');
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutState | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  const {
    history,
    saveWorkout,
    getExercisePR,
    getSuggestedWeight,
    getBestSetVolume,
    getMostReps,
    getProjected1RM,
    getWorkoutHistoryForExercise
  } = useWorkoutHistory();

  const handleStartWorkout = (workout: WorkoutTemplate, week: number, day: string, isHomeWorkout: boolean = false) => {
    setActiveWorkout({ workout, meta: { week, day, isHomeWorkout }, startTime: Date.now() });
  };

  const handleEndWorkout = (completedWorkout: { exercises: CompletedWorkoutExercise[] }) => {
    if (completedWorkout && activeWorkout) {
      saveWorkout({
        date: new Date().toISOString(),
        ...activeWorkout.meta,
        exercises: completedWorkout.exercises,
      });
    }
    setActiveWorkout(null);
  };

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id);
  };

  const handleDeselectExercise = () => {
    setSelectedExerciseId(null);
  };

  const renderContent = () => {
    if (activeWorkout) {
      return (
        <ActiveWorkoutView
          key={activeWorkout.startTime} // Key to force remount when starting new workout
          workout={activeWorkout.workout}
          meta={activeWorkout.meta}
          onEndWorkout={handleEndWorkout}
          getSuggestedWeight={getSuggestedWeight}
        />
      );
    }

    if (selectedExerciseId) {
      return (
        <ExerciseDetailView
          exerciseId={selectedExerciseId}
          onBack={handleDeselectExercise}
          history={history}
          getExercisePR={getExercisePR}
          getBestSetVolume={getBestSetVolume}
          getMostReps={getMostReps}
          getProjected1RM={getProjected1RM}
          getWorkoutHistoryForExercise={getWorkoutHistoryForExercise}
        />
      );
    }

    switch (currentView) {
      case 'program':
        return <WorkoutPlannerView onStartWorkout={handleStartWorkout} />;
      case 'stats':
        return <StatisticsView onSelectExercise={handleSelectExercise} getExercisePR={getExercisePR} history={history} />;
      default:
        // Fallback to stats view if state is unexpected
        return <StatisticsView onSelectExercise={handleSelectExercise} getExercisePR={getExercisePR} history={history} />;
    }
  };

  return (
    <div className="app-container" role="main" aria-label="Contenu principal de l'application">
      {renderContent()}
      {!activeWorkout && !selectedExerciseId && <BottomNav currentView={currentView} setView={setCurrentView} />}
    </div>
  );
};

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}
