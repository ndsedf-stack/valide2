import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

const muscleGroups = ["Pectoraux", "Dos", "Quadriceps", "Ischios", "Fessiers", "Épaules", "Biceps", "Triceps", "Avant-bras"];

const programData = {
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
            { id: 'latpull', name: 'Lat Pulldown (large)', sets: 4, reps: '10', rir: 2, rest: 0, startWeight: 60, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Dos"], secondary: ["Biceps"] } },
            { id: 'landminepress', name: 'Landmine Press', sets: 4, reps: '10', rir: 2, rest: 0, startWeight: 35, muscles: { primary: ["Pectoraux", "Épaules"], secondary: ["Triceps"] } }
        ]},
        { id: 'rowmachine', name: 'Rowing Machine (large)', sets: 4, reps: '10', rir: 2, rest: 75, startWeight: 50, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Dos"], secondary: ["Biceps", "Épaules"] } },
        { type: 'superset', id: 'superset_bras_dim', rest: 75, exercises: [
            { id: 'biceps_dim', name: 'Spider Curl / Incline Curl', sets: 4, reps: '12', rir: 1, rest: 0, startWeight: 12, progression: { increment: 2.5 }, bicepsRotation: true, intensification: 'myo-reps', muscles: { primary: ["Biceps"], secondary: [] } },
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
            { id: 'tricepsext', name: 'Extension Triceps Corde', sets: 5, reps: '12', rir: 1, rest: 0, startWeight: 20, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Triceps"], secondary: [] } },
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
            { id: 'legcurl', name: 'Leg Curl', sets: 5, reps: '12', rir: 1, rest: 0, startWeight: 40, progression: { increment: 5 }, intensification: 'partials', muscles: { primary: ["Ischios"], secondary: [] } },
            { id: 'legext', name: 'Leg Extension', sets: 4, reps: '15', rir: 1, rest: 0, startWeight: 35, progression: { increment: 5 }, intensification: 'partials', muscles: { primary: ["Quadriceps"], secondary: [] } }
        ]},
        { type: 'superset', id: 'superset_pecs_ven', rest: 60, exercises: [
            { id: 'cablefly_ven', name: 'Cable Fly', sets: 4, reps: '15', rir: 1, rest: 0, startWeight: 10, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Pectoraux"], secondary: [] } },
            { id: 'dbfly', name: 'Dumbbell Fly', sets: 4, reps: '12', rir: 1, rest: 0, startWeight: 10, progression: { increment: 2.5 }, intensification: 'drop-set', muscles: { primary: ["Pectoraux"], secondary: [] } }
        ]},
        { type: 'superset', id: 'superset_bras_ven', rest: 75, exercises: [
            { id: 'ezcurl', name: 'EZ Bar Curl', sets: 5, reps: '12', rir: 1, rest: 0, startWeight: 25, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Biceps"], secondary: [] } },
            { id: 'overheadext_ven', name: 'Overhead Extension', sets: 3, reps: '12', rir: 1, rest: 0, startWeight: 15, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Triceps"], secondary: [] } }
        ]},
        { id: 'latraises_ven', name: 'Lateral Raises', sets: 3, reps: '15', rir: 1, rest: 60, startWeight: 8, progression: { increment: 2.5 }, intensification: 'myo-reps', muscles: { primary: ["Épaules"], secondary: [] } },
        { id: 'wristcurl', name: 'Wrist Curl', sets: 3, reps: '20', rir: 0, rest: 45, startWeight: 30, progression: { increment: 2.5 }, muscles: { primary: ["Avant-bras"], secondary: [] } },
      ]
    },
  },
  homeWorkouts: {
    mardi: { id: 'hammer_home', name: 'Hammer Curl', sets: 3, reps: '12', rir: 1, rest: 60, startWeight: 12, progression: { increment: 2.5 }, muscles: { primary: ["Biceps", "Avant-bras"], secondary: [] } },
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

const generateMockHistory = () => {
    const mockHistory = {};
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

            const completedWorkout = {
                date: dateString,
                week: week + 1,
                day: day,
                exercises: JSON.parse(JSON.stringify(workoutTemplate.exercises)).map((exoTemplate) => {
                    const processExo = (
                        subExoTemplate
                    ) => {
                        const newCompletedExo = {
                            ...subExoTemplate,
                            sets: [],
                        };

                        const numSets = subExoTemplate.sets;
                        const targetReps = parseInt((subExoTemplate.reps || '8').split('-')[0]);
                        const progressionIncrement = (subExoTemplate.progression && subExoTemplate.progression.increment) ? subExoTemplate.progression.increment : 2.5;
                        const startWeight = subExoTemplate.startWeight !== undefined ? subExoTemplate.startWeight : 0;
                        
                        newCompletedExo.sets = Array.from({ length: numSets }, (_, i) => {
                            const weight = startWeight + (week * progressionIncrement * 0.75);
                            return {
                                id: `${subExoTemplate.id}-${i}-${Date.now()}-${Math.random()}`,
                                weight: Math.round(weight * 4) / 4,
                                reps: targetReps + Math.floor(Math.random() * 3) - 1,
                                rir: Math.floor(Math.random() * 2) + 1,
                                completed: true
                            };
                        });
                        return newCompletedExo;
                    };

                    if ('type' in exoTemplate && exoTemplate.type === 'superset') {
                        return { 
                            ...exoTemplate, 
                            exercises: exoTemplate.exercises.map(e => processExo(e)) 
                        };
                    } else {
                        return processExo(exoTemplate);
                    }
                })
            };
            mockHistory[dateString] = completedWorkout;
        });
    }
    return mockHistory;
};


const useWorkoutHistory = () => {
    const [history, setHistory] = useState(() => {
        try {
            const savedData = localStorage.getItem(DB_KEY);
            if (savedData) {
                const parsedData = JSON.parse(savedData);
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

    const saveWorkout = useCallback((w) => {
        const newHistory = { ...history, [w.date]: w };
        setHistory(newHistory);
        localStorage.setItem(DB_KEY, JSON.stringify(newHistory));
    }, [history]);
    
    const getExercisePR = useCallback((exerciseId) => {
        let best = { weight: 0, reps: 0 };
        Object.values(history).forEach((workout) => {
            if (!workout?.exercises) return;
            const processExo = (exo) => {
                if (exo.id === exerciseId) {
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
            workout.exercises.forEach((exo) => { 
                if ('type' in exo && exo.type === 'superset') {
                    exo.exercises.forEach(processExo);
                } else {
                    processExo(exo);
                }
            });
        });
        return best;
    }, [history]);

    const getBestSetVolume = useCallback((exerciseId) => {
        let bestVolume = 0;
        Object.values(history).forEach((workout) => {
            if (!workout?.exercises) return;
            workout.exercises.forEach((exo) => {
                const processExo = (subExo) => {
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
                if ('type' in exo && exo.type === 'superset') exo.exercises.forEach(processExo);
                else processExo(exo);
            });
        });
        return Math.round(bestVolume);
    }, [history]);

    const getMostReps = useCallback((exerciseId) => {
        let mostReps = 0;
        Object.values(history).forEach((workout) => {
            if (!workout?.exercises) return;
            workout.exercises.forEach((exo) => {
                const processExo = (subExo) => {
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
                if ('type' in exo && exo.type === 'superset') exo.exercises.forEach(processExo);
                else processExo(exo);
            });
        });
        return mostReps;
    }, [history]);

    const getProjected1RM = useCallback((exerciseId) => {
        let best1RM = 0;
        Object.values(history).forEach((workout) => {
            if (!workout?.exercises) return;
            workout.exercises.forEach((exo) => {
                const processExo = (subExo) => {
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
                if ('type' in exo && exo.type === 'superset') exo.exercises.forEach(processExo);
                else processExo(exo);
            });
        });
        return Math.round(best1RM);
    }, [history]);
    
    const getWorkoutHistoryForExercise = useCallback((exerciseId) => {
        const exerciseHistory = [];
        Object.values(history)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .forEach((workout) => {
            const date = new Date(workout.date);
            workout.exercises.forEach((exo) => {
                const processExo = (subExo) => {
                    if (subExo.id === exerciseId && subExo.sets && subExo.sets.some(s => s.completed)) {
                        exerciseHistory.push({
                            date: date,
                            sets: subExo.sets.filter(s => s.completed).map(s => ({
                                weight: parseFloat(String(s.weight)) || 0,
                                reps: parseInt(String(s.reps)) || 0,
                                rir: parseInt(String(s.rir)) || 0
                            }))
                        });
                    }
                };
                if ('type' in exo && exo.type === 'superset') exo.exercises.forEach(processExo);
                else processExo(exo);
            });
        });
        return exerciseHistory;
    }, [history]);

    const getSuggestedWeight = useCallback((exercise) => {
        const exerciseId = exercise.id;
        let lastLoggedWeight = exercise.startWeight;
        let lastLoggedReps = parseInt((exercise.reps || '8').split('-')[0]);

        const sortedWorkouts = Object.values(history).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        for (const workout of sortedWorkouts) {
            if (!workout?.exercises) continue;

            const processExo = (subExo) => {
                if (subExo.id === exerciseId && subExo.sets) {
                    for (let i = subExo.sets.length - 1; i >= 0; i--) {
                        const set = subExo.sets[i];
                        if (set.completed && parseFloat(String(set.weight)) > 0) {
                            lastLoggedWeight = parseFloat(String(set.weight));
                            lastLoggedReps = parseInt(String(set.reps));
                            return true;
                        }
                    }
                }
                return false;
            };

            for (const exo of workout.exercises) {
                if ('type' in exo && exo.type === 'superset' && exo.exercises) {
                    if (exo.exercises.some(processExo)) return lastLoggedWeight;
                } else {
                    if (processExo(exo)) return lastLoggedWeight;
                }
            }
        }
        return lastLoggedWeight;
    }, [history]);


    return { history, saveWorkout, getExercisePR, getSuggestedWeight, getBestSetVolume, getMostReps, getProjected1RM, getWorkoutHistoryForExercise };
};

// --- ICONS ---
const DumbbellIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, React.createElement("path", { d: "M21 8.5C21 7.12 19.88 6 18.5 6H17V5C17 4.45 16.55 4 16 4H8C7.45 4 7 4.45 7 5V6H5.5C4.12 6 3 7.12 3 8.5V15.5C3 16.88 4.12 18 5.5 18H7V19C7 19.55 7.45 20 8 20H16C16.55 20 17 19.55 17 19V18H18.5C19.88 18 21 16.88 21 15.5V8.5ZM5 16.5V8.5C5 8.22 5.22 8 5.5 8H6V16H5.5C5.22 16 5 16.28 5 16.5ZM19 15.5C19 16.28 18.78 16 18.5 16H18V8H18.5C18.78 8 19 8.22 19 8.5V15.5Z" }));
const ChartIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, React.createElement("path", { d: "M16 6H18V20H16V6ZM11 11H13V20H11V11ZM6 16H8V20H6V16ZM20 2H2V4H20V2Z" }));
const PlusIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: "24", height: "24" }, React.createElement("path", { d: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"}));
const WorkoutIcon = () => React.createElement("svg", { className: "icon", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" }));
const WeightIcon = () => React.createElement("svg", { className: "icon", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" }));
const SetsIcon = () => React.createElement("svg", { className: "icon", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" }));
const ArrowPathIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, React.createElement("path", { fillRule: "evenodd", d: "M15.75 2.25a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-1.5 0V4.53L8.03 11.03a.75.75 0 0 1-1.06-1.06L13.47 3.5H9a.75.75 0 0 1 0-1.5h6.75Zm-8.25 9a.75.75 0 0 0-.75-.75h-6a.75.75 0 0 0 0 1.5h4.53L-1.03 1.53a.75.75 0 1 0 1.06 1.06L6.53 9H3a.75.75 0 0 0-.75.75v6.75a.75.75 0 0 0 1.5 0v-4.53l6.47 6.47a.75.75 0 0 0 1.06-1.06L5.53 15H9.75a.75.75 0 0 0 .75-.75Z", clipRule: "evenodd" }));
const ChevronLeftIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", className: "w-6 h-6" }, React.createElement("path", { fillRule: "evenodd", d: "M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z", clipRule: "evenodd" }));
const TimeIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-6 h-6" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" }));
const PlusMinusIcon = () => React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", strokeWidth: 1.5, stroke: "currentColor", className: "w-6 h-6" }, React.createElement("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 4.5v15m7.5-7.5h-15" }));


// --- REUSABLE COMPONENTS ---
const MuscleGroupHeatmap = ({ workout }) => {
    if (!workout) return null;

    const workedMuscles = { primary: new Set(), secondary: new Set() };

    workout.exercises.forEach(exo => {
        if (exo.type === 'superset') { // Check for 'type' property
            exo.exercises.forEach(subExo => {
                if (subExo.muscles) {
                    subExo.muscles.primary.forEach(m => workedMuscles.primary.add(m));
                    subExo.muscles.secondary.forEach(m => workedMuscles.secondary.add(m));
                }
            });
        } else {
            if (exo.muscles) {
                exo.muscles.primary.forEach(m => workedMuscles.primary.add(m));
                exo.muscles.secondary.forEach(m => workedMuscles.secondary.add(m));
            }
        }
    });

    return React.createElement("div", { className: "muscle-heatmap" },
        muscleGroups.map(muscle => {
            const isPrimary = workedMuscles.primary.has(muscle);
            const isSecondary = workedMuscles.secondary.has(muscle) && !isPrimary;
            let status = 'inactive';
            if (isPrimary) status = 'primary';
            else if (isSecondary) status = 'secondary';
            
            return React.createElement("div", { key: muscle, className: `muscle-tag muscle-${status}` }, muscle);
        })
    );
};

const ProgressionChart = ({ exerciseId, exerciseName, history }) => {
    const containerRef = React.useRef(null);
    const [tooltip, setTooltip] = useState(null);

    const dataPoints = useMemo(() => {
        const points = [];
        Object.values(history).forEach((w) => {
            if (!w?.exercises) return;
            let maxWeight = 0;
            w.exercises.forEach((exo) => {
                // Check if exo has 'type' property and it's 'superset'
                const subExercises = (exo.type === 'superset') ? exo.exercises : [exo];
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
        return React.createElement("div", { className: "progression-chart-container" },
            React.createElement("p", { className: "empty-stat-small" }, "Enregistrez au moins 2 séances pour voir la courbe.")
        );
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

    const getX = date => ((date.getTime() - minDate) / dateRange) * width;
    const getY = weight => height - ((weight - minWeight) / weightRange) * height;

    const path = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.date)} ${getY(p.weight)}`).join(' ');

    const handleMouseMove = (e, dataPoint) => {
        const svgRect = e.target.ownerSVGElement?.getBoundingClientRect();
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

    return React.createElement("div", { className: "progression-chart-container", ref: containerRef, onMouseLeave: handleMouseLeave },
        React.createElement("svg", { className: "progression-chart-svg", viewBox: `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}` },
            React.createElement("g", { transform: `translate(${margin.left}, ${margin.top})` },
                // Y-Axis
                Array.from({ length: 5 }).map((_, i) => {
                    const y = height * (i / 4);
                    const weight = maxWeight - (i / 4) * weightRange;
                    return React.createElement("g", { key: i },
                        React.createElement("line", { className: "grid-line", x1: 0, x2: width, y1: y, y2: y }),
                        React.createElement("text", { className: "axis-label", x: -5, y: y + 3, textAnchor: 'end' }, Math.round(weight))
                    );
                }),
                // X-Axis
                 Array.from({ length: 3 }).map((_, i) => {
                    const date = new Date(minDate + (i/2) * dateRange);
                     const x = getX(date);
                     return React.createElement("text", { key: i, className: "axis-label", x: x, y: height + 15, textAnchor: 'middle' }, date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
                }),
                React.createElement("path", { className: "data-line", d: path, stroke: "url(#line-gradient-chart)" }),
                dataPoints.map((p, i) => React.createElement("circle", {
                    key: i,
                    className: "data-point",
                    cx: getX(p.date),
                    cy: getY(p.weight),
                    r: 4,
                    onMouseEnter: (e) => handleMouseMove(e, p),
                })),
                 React.createElement("defs", null, React.createElement("linearGradient", { id: "line-gradient-chart", x1: "0%", y1: "0%", x2: "100%", y2: "0%" }, React.createElement("stop", { offset: "0%", stopColor: "var(--color-primary)" }), React.createElement("stop", { offset: "100%", stopColor: "var(--color-primary-light)" })))
            )
        ),
        tooltip && React.createElement("div", {
            className: "chart-tooltip visible",
            style: { left: `${tooltip.x}px`, top: `${tooltip.y}px` }
        }, tooltip.content)
    );
};

const CircularRestTimer = ({ duration, onFinish, currentExerciseName, nextSetInfo }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
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
            setTimeLeft(t => t > 0 ? t - 1 : 0);
        }, 1000);
        return () => clearInterval(interval);
    }, [timeLeft, onFinish]);

    const handleAdjustTime = (amount) => {
        setTimeLeft(t => Math.max(0, t + amount));
    };

    const progressOffset = circumference - (timeLeft / duration) * circumference;

    return React.createElement("div", { className: "rest-timer-overlay" }, 
        React.createElement("div", { className: "timer-container" },
            React.createElement("svg", { className: "timer-circle-svg", viewBox: "0 0 200 200" },
                React.createElement("circle", { className: "timer-track", cx: "100", cy: "100", r: radius, strokeDasharray: circumference }),
                React.createElement("circle", { className: "timer-progress", cx: "100", cy: "100", r: radius, strokeDasharray: circumference, strokeDashoffset: progressOffset })
            ),
            React.createElement("div", { className: "timer-content" },
                React.createElement("div", { className: "timer-time" }, `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`),
                currentExerciseName && React.createElement("div", { className: "timer-next-exercise" }, 
                    "Prochaine: ", React.createElement("strong", null, currentExerciseName), 
                    nextSetInfo && ` - ${nextSetInfo}`
                )
            )
        ),
        React.createElement("div", { className: "timer-controls" },
            React.createElement("button", { onClick: () => handleAdjustTime(-15), "aria-label": "Réduire le temps de repos de 15 secondes" }, "-15s"),
            React.createElement("button", { onClick: () => handleAdjustTime(15), "aria-label": "Augmenter le temps de repos de 15 secondes" }, "+15s")
        ),
        React.createElement("button", { className: "skip-timer-btn", onClick: onFinish }, "Passer")
    );
};

const IntensificationStep = ({ title, description, actionText, onAction, timer }) => {
    const [timeLeft, setTimeLeft] = useState(timer);
    useEffect(() => {
        if (!timer) return;
        const interval = setInterval(() => setTimeLeft(t => (!t || t <= 1 ? 0 : t - 1)), 1000);
        return () => clearInterval(interval);
    }, [timer]);
    return React.createElement("div", { className: "intensification-prompt" }, React.createElement("h4", null, title), description && React.createElement("p", null, description), timer && React.createElement("div", { className: "intensification-timer" }, "Repos: ", timeLeft, "s"), React.createElement("button", { className: "intensification-action", onClick: onAction, disabled: !!(timeLeft && timeLeft > 0) }, actionText));
};

const TechniqueHighlight = ({ exercise, block }) => {
    if (!block) return null;
    const getTechniqueForExo = (exo) => {
        if (!exo.intensification) return null; // Access intensification directly (it's optional)
        const techName = block.technique.name.toLowerCase();
        if (techName.includes(exo.intensification.replace('-', ''))) {
            return block.technique.name.split('&')[0].trim();
        }
        return null;
    };
    const techniques = [];
    if (exercise.type === 'superset') { // Check for 'type' property
        exercise.exercises.forEach(exo => {
            const tech = getTechniqueForExo(exo);
            if (tech && !techniques.includes(tech)) {
                techniques.push(tech);
            }
        });
    } else {
        const tech = getTechniqueForExo(exercise);
        if (tech) {
            techniques.push(tech);
        }
    }
    if (techniques.length === 0) return null;
    return React.createElement("div", { className: "technique-highlight-box" }, React.createElement("strong", null, "🔥 Technique Spéciale: "), techniques.join(' / '));
};

const SetsTracker = ({ exercise, onSetComplete, onInputChange, onAddBonusSet, block, activeSetIndex }) => {
    const [intensificationState, setIntensificationState] = useState({ active: false, step: 0, type: null });

    const handleCheck = (set, setIndex, subExoIndex = -1) => {
        onSetComplete(!set.completed, setIndex, subExoIndex);
        
        // Use property check for 'type' to narrow down exercise type
        let individualExoForIntensification;
        if (exercise.type === 'superset') { // Check for 'type' property
            individualExoForIntensification = exercise.exercises[subExoIndex];
        } else {
            individualExoForIntensification = exercise;
        }

        const nonBonusSets = individualExoForIntensification.sets.filter((s) => !s.isBonus);
        
        if (!set.completed && !set.isBonus && setIndex === nonBonusSets.length - 1) {
            // Access intensification directly (it's optional)
            if (individualExoForIntensification.intensification) {
                setIntensificationState({ active: true, type: individualExoForIntensification.intensification, step: 1 });
            }
        }
    };

    const renderIntensificationGuide = (exo, subExoIndex = -1) => {
        if (!exo.intensification) { // Access intensification directly (it's optional)
            return null;
        }

        if (!intensificationState.active || intensificationState.type !== exo.intensification || !block) return null;
        
        const setsToConsider = exo.sets || [];
        const lastSet = [...setsToConsider].filter((s) => !s.isBonus).pop(); 
        if (!lastSet) return null;

        if (block.technique.name === 'Rest-Pause' && intensificationState.type === 'rest-pause') return React.createElement(IntensificationStep, { title: "🔥 Rest-Pause", description: null, actionText: "Ajouter la série bonus", onAction: () => { onAddBonusSet({ weight: lastSet.weight, reps: '', rir: 0 }, subExoIndex); setIntensificationState({ active: false, step: 0, type: null }); }, timer: 20 });
        if (block.technique.name.includes('Drop-Sets') && intensificationState.type === 'drop-set') return React.createElement(IntensificationStep, { title: "🔥 Drop-Set", description: "Baissez le poids de ~25%.", actionText: "Ajouter la série Drop", onAction: () => { onAddBonusSet({ weight: (parseFloat(String(lastSet.weight)) * 0.75).toFixed(1), reps: '', rir: 0 }, subExoIndex); setIntensificationState({ active: false, step: 0, type: null }); }, timer: null });
        return null;
    };
    
    if (exercise.type === 'superset') { // Check for 'type' property
      const numSets = exercise.exercises.length > 0 ? exercise.exercises[0].sets.filter(s => !s.isBonus).length : 0;
      return React.createElement("div", { className: "sets-tracker" }, 
        Array.from({ length: numSets }).map((_, setIndex) => {
            const isCompleted = exercise.exercises.every(e => e.sets[setIndex]?.completed);
            const isActive = setIndex === activeSetIndex;
            const rowClasses = `superset-set-row ${isActive ? 'active' : ''}`;

            return React.createElement("div", { className: rowClasses, key: `superset-set-${setIndex}` },
                React.createElement("div", { className: "superset-set-header" },
                    React.createElement("div", { className: "superset-set-number" }, "Série ", setIndex + 1),
                    React.createElement("button", { 
                        "aria-label": `Valider série ${setIndex + 1} du superset`,
                        className: `set-check-btn ${isCompleted ? 'completed' : ''}`, 
                        onClick: () => {
                            const newCompletedStatus = !isCompleted;
                            exercise.exercises.forEach((_, subExoIndex) => {
                                onSetComplete(newCompletedStatus, setIndex, subExoIndex);
                            });
                        } 
                    }, "✓")
                ),
                React.createElement("div", { className: "superset-set-exercises" },
                    exercise.exercises.map((subExo, subExoIndex) => (
                        React.createElement("div", { className: "superset-set-exercise-card", key: `${subExo.id}-${setIndex}` },
                            React.createElement("div", { className: "superset-set-exercise-name" }, subExo.name),
                            React.createElement("div", { className: "superset-set-inputs" },
                                React.createElement("div", { className: "set-input" },
                                    React.createElement("label", null, "Poids"),
                                    React.createElement("input", { "aria-label": `Poids pour ${subExo.name} série ${setIndex + 1}`, type: "number", value: subExo.sets[setIndex]?.weight || '', onChange: (e) => onInputChange(e.target.value, 'weight', setIndex, subExoIndex) })
                                ),
                                React.createElement("div", { className: "set-input" },
                                    React.createElement("label", null, "Reps"),
                                    React.createElement("input", { "aria-label": `Reps pour ${subExo.name} série ${setIndex + 1}`, type: "number", value: subExo.sets[setIndex]?.reps || '', onChange: (e) => onInputChange(e.target.value, 'reps', setIndex, subExoIndex) })
                                ),
                                React.createElement("div", { className: "set-input" },
                                    React.createElement("label", null, "RIR"),
                                    React.createElement("input", { "aria-label": `RIR pour ${subExo.name} série ${setIndex + 1}`, type: "number", value: subExo.sets[setIndex]?.rir || '', onChange: (e) => onInputChange(e.target.value, 'rir', setIndex, subExoIndex) })
                                )
                            )
                        )
                    ))
                )
            );
        })
      );
    }

    const baseExercise = exercise;

    return React.createElement("div", { className: "sets-tracker-container" }, 
        React.createElement("div", { className: "sets-tracker" }, baseExercise.sets.map((set, index) => {
            const isActive = index === activeSetIndex;
            const rowClasses = `set-row ${set.isBonus ? 'bonus-set' : ''} ${isActive ? 'active' : ''}`;
            
            return React.createElement("div", { className: rowClasses, key: set.id || index }, 
                React.createElement("div", { className: "set-number" }, set.isBonus ? '🔥' : index + 1), 
                React.createElement("div", { className: "set-input" }, 
                    React.createElement("label", null, "Poids"), 
                    React.createElement("input", { "aria-label": `Poids pour série ${index + 1}`, type: "number", value: set.weight, onChange: (e) => onInputChange(e.target.value, 'weight', index) })
                ), 
                React.createElement("div", { className: "set-input" }, 
                    React.createElement("label", null, "Reps"), 
                    React.createElement("input", { "aria-label": `Reps pour série ${index + 1}`, type: "number", value: set.reps, onChange: (e) => onInputChange(e.target.value, 'reps', index) })
                ), 
                React.createElement("div", { className: "set-input" }, 
                    React.createElement("label", null, "RIR"), 
                    React.createElement("input", { "aria-label": `RIR pour série ${index + 1}`, type: "number", value: set.rir, onChange: (e) => onInputChange(e.target.value, 'rir', index) })
                ), 
                React.createElement("button", { "aria-label": `Valider série ${index + 1}`, className: `set-check-btn ${set.completed ? 'completed' : ''}`, onClick: () => handleCheck(set, index) }, "✓")
            );
        })), 
        renderIntensificationGuide(baseExercise)
    );
};

const ActiveWorkoutView = ({ workout, meta, onEndWorkout, getSuggestedWeight }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [restTime, setRestTime] = useState(0);
    const [workoutState, setWorkoutState] = useState(() => 
        workout.exercises.map((exoTemplate) => {
            if (exoTemplate.type === 'superset') { // Check for 'type' property
              const numSets = Math.max(...exoTemplate.exercises.map(e => e.sets));
              return { 
                ...exoTemplate, 
                exercises: exoTemplate.exercises.map(subExoTemplate => ({
                  ...subExoTemplate, 
                  sets: Array.from({length: numSets}, (_,i) => ({
                    id: `${subExoTemplate.id}-${i}-${Math.random()}`, 
                    weight: getSuggestedWeight(subExoTemplate) || '', 
                    reps: (subExoTemplate.reps || "8").toString().split('-')[0], 
                    rir: subExoTemplate.rir || 1, 
                    completed: false
                  })) 
                })) 
              };
            }
            return { 
                ...exoTemplate, 
                sets: Array.from({ length: exoTemplate.sets }, (_, i) => ({ 
                    id: `${exoTemplate.id}-${i}-${Math.random()}`, 
                    weight: getSuggestedWeight(exoTemplate) || '', 
                    reps: (exoTemplate.reps || "8").toString().split('-')[0], 
                    rir: exoTemplate.rir || 1, 
                    completed: false 
                })) 
            };
        })
    );
    const currentExercise = workoutState[currentIndex];
    const currentBlock = useMemo(() => programData.blocks.find(b => b.weeks.includes(meta.week)) || { id: 0, name: "Phase Initiale", weeks: [], technique: { name: "Technique", desc: "Concentration sur la forme." } }, [meta.week]);

    const isSupersetBlock = (currentExercise.type === 'superset'); // Check for 'type' property
    const setsForActiveCheck = isSupersetBlock ? currentExercise.exercises[0].sets : currentExercise.sets;
    const firstIncompleteSet = setsForActiveCheck.findIndex(s => !s.completed);
    const activeSetIndex = firstIncompleteSet === -1 ? setsForActiveCheck.length : firstIncompleteSet;

    const handleSetComplete = useCallback((isCompleted, setIndex, subExoIndex = -1) => {
        setWorkoutState(current => {
            const newState = JSON.parse(JSON.stringify(current));
            const exo = newState[currentIndex];
            let set;
            let targetExoForRestCheck;

            if (exo.type === 'superset') { // Check for 'type' property
                const supersetBlock = exo;
                if (subExoIndex > -1) {
                    set = supersetBlock.exercises[subExoIndex].sets[setIndex];
                } else {
                    set = supersetBlock.exercises[0].sets[setIndex];
                }
                targetExoForRestCheck = supersetBlock;
            } else {
                set = exo.sets[setIndex];
                targetExoForRestCheck = exo;
            }
            set.completed = isCompleted;

            if (isCompleted && targetExoForRestCheck.rest) {
                if (targetExoForRestCheck.type === 'superset') { // Check for 'type' property
                    if (targetExoForRestCheck.exercises.every(e => e.sets[setIndex]?.completed)) {
                        setRestTime(targetExoForRestCheck.rest);
                        setIsResting(true);
                    }
                } else {
                    setRestTime(targetExoForRestCheck.rest);
                    setIsResting(true);
                }
            }
            return newState;
        });
    }, [currentIndex]);


    const handleInputChange = (value, field, setIndex, subExoIndex = -1) => {
        const newWorkoutState = JSON.parse(JSON.stringify(workoutState));
        let targetSetContainer;

        if (newWorkoutState[currentIndex].type === 'superset') { // Check for 'type' property
            targetSetContainer = newWorkoutState[currentIndex].exercises[subExoIndex];
        } else {
            targetSetContainer = newWorkoutState[currentIndex];
        }
        targetSetContainer.sets[setIndex][field] = value;
        setWorkoutState(newWorkoutState);
    };

    const handleAddBonusSet = (newSet, subExoIndex = -1) => {
        const newWorkoutState = [...workoutState];
        let targetExo;
        if (newWorkoutState[currentIndex].type === 'superset') { // Check for 'type' property
            targetExo = newWorkoutState[currentIndex].exercises[subExoIndex];
        } else {
            targetExo = newWorkoutState[currentIndex];
        }
        targetExo.sets.push({ id: `bonus-${targetExo.id}-${targetExo.sets.length}`, weight: '', reps: '', rir: 0, ...newSet, completed: false, isBonus: true });
        setWorkoutState(newWorkoutState);
    };
    return React.createElement("div", { className: "main-content" }, 
        React.createElement("div", { className: "workout-header" }, React.createElement("span", { className: "workout-progress" }, currentIndex + 1, " / ", workoutState.length), React.createElement("button", { className: "end-workout-btn", onClick: () => onEndWorkout({ exercises: workoutState }) }, "Terminer")), 
        React.createElement("div", { className: "current-exercise-info" }, 
            React.createElement("h2", null, 
                isSupersetBlock ? 
                    currentExercise.exercises.map(e => e.name).join(' + ') : 
                    currentExercise.name
            )
        ), 
        React.createElement(TechniqueHighlight, { exercise: currentExercise, block: currentBlock }), 
        React.createElement(SetsTracker, { exercise: currentExercise, onSetComplete: handleSetComplete, onInputChange: handleInputChange, onAddBonusSet: handleAddBonusSet, block: currentBlock, activeSetIndex: activeSetIndex }), 
        React.createElement("div", { className: "workout-navigation" }, React.createElement("button", { onClick: () => setCurrentIndex(i => i - 1), disabled: currentIndex === 0 }, "Précédent"), React.createElement("button", { onClick: () => setCurrentIndex(i => i + 1), disabled: currentIndex === workoutState.length - 1 }, "Suivant")), 
        isResting && React.createElement(CircularRestTimer, { 
            duration: restTime, 
            onFinish: () => setIsResting(false), 
            currentExerciseName: isSupersetBlock ? 
                currentExercise.exercises.map(e => e.name).join(' + ') : 
                currentExercise.name, 
            nextSetInfo: `Set ${activeSetIndex + 1}/${setsForActiveCheck.length}` 
        })
    );
};

// --- NEW: Statistics Components (Hevy Inspired) ---

const SegmentedControl = ({ options, selected, onChange, className }) => {
    return React.createElement("div", { className: `segmented-control ${className || ''}` },
        options.map(option => React.createElement("button", {
            key: option.value,
            className: selected === option.value ? 'active' : '',
            onClick: () => onChange(option.value)
        }, option.label))
    );
};

const KPICards = ({ stats }) => {
    const kpis = [
        { label: 'Séances', value: stats.totalWorkouts, icon: React.createElement(WorkoutIcon, null) },
        { label: 'Volume (kg)', value: Math.round(stats.totalVolume).toLocaleString('fr-FR'), icon: React.createElement(WeightIcon, null) },
        { label: 'Séries', value: stats.totalSets, icon: React.createElement(SetsIcon, null) }
    ];
    return React.createElement("div", { className: "kpi-grid" },
        kpis.map(kpi => React.createElement("div", { className: "kpi-card", key: kpi.label },
            kpi.icon,
            React.createElement("div", { className: "kpi-value" }, kpi.value),
            React.createElement("div", { className: "kpi-label" }, kpi.label)
        ))
    );
};

const SevenDayStreak = ({ history }) => {
    const today = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date();
        date.setDate(today.getDate() - (6 - i));
        return date;
    });

    const trainedDays = useMemo(() => {
        const dates = new Set();
        Object.values(history).forEach((w) => {
            dates.add(new Date(w.date).toDateString());
        });
        return dates;
    }, [history]);
    
    return React.createElement("div", { className: "seven-day-streak" },
        React.createElement("div", { className: "streak-header" },
            React.createElement("span", null, "7-Day Streak")
        ),
        React.createElement("div", { className: "streak-days" },
            days.map((day, i) => React.createElement("div", { className: "streak-day", key: i },
                React.createElement("span", { className: "day-label" }, day.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)),
                React.createElement("div", { className: `day-circle ${trainedDays.has(day.toDateString()) ? 'trained' : ''}` }, day.getDate())
            ))
        )
    );
};


const AnatomyChart = ({ history }) => {
    const [view, setView] = useState('front'); // 'front' or 'back'

    const workedMusclesLast7Days = useMemo(() => {
        const muscles = new Set();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        Object.values(history).forEach((workout) => {
            if (new Date(workout.date) >= sevenDaysAgo) {
                workout.exercises.forEach((exo) => {
                    const processMuscle = (subExo) => {
                        if (subExo.muscles) {
                            subExo.muscles.primary.forEach(m => muscles.add(m));
                            subExo.muscles.secondary.forEach(m => muscles.add(m));
                        }
                    };
                    if (exo.type === 'superset') exo.exercises.forEach(processMuscle); // Check for 'type' property
                    else processMuscle(exo);
                });
            }
        });
        return muscles;
    }, [history]);
    
    const muscleMapping = {
        Pectoraux: 'chest', Dos: 'back', Quadriceps: 'quads', Ischios: 'hamstrings',
        Fessiers: 'glutes', Épaules: 'shoulders', Biceps: 'biceps', Triceps: 'triceps',
        'Avant-bras': 'forearms', Mollets: 'calves'
    };

    const frontMuscles = {
        shoulders: { d: "M65,95 C45,100 40,120 40,130 L35,160 L60,150 L65,110 Z M135,95 C155,100 160,120 160,130 L165,160 L140,150 L135,110 Z" },
        chest: { d: "M65,110 L60,150 L100,160 L100,110 Z M135,110 L140,150 L100,160 L100,110 Z" },
        biceps: { d: "M35,160 L60,150 L60,190 L35,190 Z M165,160 L140,150 L140,190 L165,190 Z" },
        forearms: { d: "M35,190 L60,190 L60,230 L35,230 Z M165,190 L140,190 L140,230 L165,230 Z" },
        quads: { d: "M60,240 L100,240 L100,350 L60,350 Z M100,240 L140,240 L140,350 L100,350 Z" },
        abdominals: { d: "M60,160 L140,160 L140,240 L60,240 Z" }
    };
    
    const backMuscles = {
        shoulders: { d: "M65,95 C45,100 40,120 40,130 L35,160 L60,150 L65,110 Z M135,95 C155,100 160,120 160,130 L165,160 L140,150 L135,110 Z" },
        back: { d: "M65,110 L135,110 L140,230 L60,230 Z" },
        triceps: { d: "M35,160 L60,150 L60,190 L35,190 Z M165,160 L140,150 L140,190 L165,190 Z" },
        forearms: { d: "M35,190 L60,190 L60,230 L35,230 Z M165,190 L140,190 L140,230 L165,230 Z" },
        glutes: { d: "M60,230 L140,230 L140,280 L60,280 Z" },
        hamstrings: { d: "M60,280 L100,280 L100,350 L60,350 Z M100,280 L140,280 L140,350 L100,350 Z" }
    };
    
    const isMuscleWorked = (muscleName) => {
        return muscleName ? workedMusclesLast7Days.has(muscleName) : false;
    };

    const renderPaths = (muscleSet) => {
        return Object.entries(muscleSet).map(([name, data]) => {
            const muscleGroupName = Object.keys(muscleMapping).find(key => muscleMapping[key] === name);
            const isWorked = isMuscleWorked(muscleGroupName);
            return React.createElement('path', { key: name, d: data.d, className: isWorked ? 'worked' : '' });
        });
    };

    return React.createElement('div', { className: 'anatomy-container' },
        React.createElement('button', { className: 'anatomy-toggle', onClick: () => setView(v => v === 'front' ? 'back' : 'front'), "aria-label": "Basculer la vue anatomique" }, React.createElement(ArrowPathIcon, null)),
        React.createElement('div', { className: 'anatomy-chart' },
            React.createElement('div', { className: 'anatomy-view' },
                React.createElement('svg', { viewBox: "0 0 200 450", role: "img", "aria-labelledby": "anatomy-chart-title" },
                    React.createElement("title", { id: "anatomy-chart-title" }, `Muscles sollicités - vue ${view === 'front' ? 'avant' : 'arrière'}`),
                    view === 'front' ? renderPaths(frontMuscles) : renderPaths(backMuscles)
                )
            )
        )
    );
};

const MuscleRadarChart = ({ currentStats, previousStats }) => {
    const radarMuscles = ["Pectoraux", "Dos", "Épaules", "Quadriceps", "Ischios", "Biceps", "Triceps"];
    const size = 300;
    const center = size / 2;
    const radius = size * 0.4;

    const calculatePoints = (stats) => {
        const allStatsValues = [ ...Object.values(currentStats), ...Object.values(previousStats) ];
        const maxVal = Math.max(...allStatsValues.filter(val => typeof val === 'number'), 1);

        return radarMuscles.map((muscle, i) => {
            const angle = (i / radarMuscles.length) * 2 * Math.PI - Math.PI / 2;
            const value = stats[muscle] || 0;
            const r = (value / maxVal) * radius;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
        }).join(" ");
    };

    const currentPoints = calculatePoints(currentStats);
    const previousPoints = calculatePoints(previousStats);

    return React.createElement("div", { className: "radar-chart-container" },
        React.createElement("svg", { viewBox: `0 0 ${size} ${size}`, role: "img", "aria-labelledby": "radar-chart-title" },
            React.createElement("title", { id: "radar-chart-title" }, "Répartition musculaire (current vs previous)"),
            radarMuscles.map((muscle, i) => {
                const angle = (i / radarMuscles.length) * 2 * Math.PI - Math.PI / 2;
                const x2 = center + radius * Math.cos(angle);
                const y2 = center + radius * Math.sin(angle);
                const labelX = center + (radius + 20) * Math.cos(angle);
                const labelY = center + (radius + 20) * Math.sin(angle);
                return React.createElement("g", { key: muscle },
                    React.createElement("line", { className: "radar-axis", x1: center, y1: center, x2: x2, y2: y2 }),
                    React.createElement("text", { className: "radar-label", x: labelX, y: labelY, dy: "0.33em" }, muscle.substring(0,4))
                );
            }),
            React.createElement("polygon", { className: "radar-polygon-previous", points: previousPoints }),
            React.createElement("polygon", { className: "radar-polygon-current", points: currentPoints })
        )
    );
};

const MuscleVolumeTrendChart = ({ history }) => {
    const [granularity, setGranularity] = useState('week');
    const [visibleMuscles, setVisibleMuscles] = useState(muscleGroups);
    const [tooltip, setTooltip] = useState(null);
    const containerRef = React.useRef(null);
    const muscleColors = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#AF52DE', '#5E5CE6', '#64D2FF', '#FFD60A', '#A2845E'];

    const toggleMuscleVisibility = (muscle) => {
        setVisibleMuscles(current => 
            current.includes(muscle) ? current.filter(m => m !== muscle) : [...current, muscle]
        );
    };

    const trendData = useMemo(() => {
        const sortedHistory = Object.values(history).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (sortedHistory.length === 0) return [];
        
        const dataMap = new Map();
        
        sortedHistory.forEach((workout) => {
            const date = new Date(workout.date);
            let key;
            if (granularity === 'week') {
                const startOfWeek = new Date(date);
                startOfWeek.setDate(date.getDate() - date.getDay());
                key = startOfWeek.toISOString().split('T')[0];
            } else { // month
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            if (!dataMap.has(key)) {
                const initialCounts = {};
                muscleGroups.forEach(m => initialCounts[m] = 0);
                dataMap.set(key, { date: date, ...initialCounts });
            }

            const periodData = dataMap.get(key);
            workout.exercises.forEach((exo) => {
                const processExo = (subExo) => {
                    if (subExo.muscles) {
                        subExo.muscles.primary.forEach(m => {
                            periodData[m] += (subExo.sets || []).filter(s => s.completed).length;
                        });
                    }
                };
                if (exo.type === 'superset') exo.exercises.forEach(processExo); // Check for 'type' property
                else processExo(exo);
            });
        });
        return Array.from(dataMap.values());
    }, [history, granularity]);
    
    if (trendData.length < 2) {
         return React.createElement("p", { className: "empty-stat-small" }, "Pas assez de données pour afficher une tendance.");
    }
    
    const margin = { top: 20, right: 20, bottom: 30, left: 35 };
    const width = 350 - margin.left - margin.right;
    const height = 200 - margin.top - margin.bottom;

    const maxSets = Math.max(...trendData.flatMap(d => Object.values(d).filter(val => typeof val === 'number')), 1);
    const dates = trendData.map(d => d.date);
    const minDate = dates[0].getTime();
    const maxDate = dates[dates.length - 1].getTime();
    const dateRange = maxDate - minDate === 0 ? 1 : maxDate - minDate;
    
    const getX = (date) => ((date.getTime() - minDate) / dateRange) * width;
    const getY = (sets) => height - ((sets / maxSets) * height);
    
    const handleMouseMove = (e) => {
        const svg = containerRef.current?.querySelector('svg');
        if (!svg) return;
        
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const cursorPoint = pt.matrixTransform(svg.getScreenCTM()?.inverse() || new DOMMatrix());
        
        const xPos = cursorPoint.x - margin.left;
        const closestPoint = trendData.reduce((prev, curr) => 
            Math.abs(getX(curr.date) - xPos) < Math.abs(getX(prev.date) - xPos) ? curr : prev
        );
        
        setTooltip({
            x: getX(closestPoint.date) + margin.left,
            y: e.nativeEvent.offsetY - 20,
            content: closestPoint
        });
    };
    
    const handleMouseLeave = () => setTooltip(null);
    
    return React.createElement("div", null,
        React.createElement("div", { className: "progression-chart-container", ref: containerRef, onMouseLeave: handleMouseLeave },
             React.createElement("svg", { className: "progression-chart-svg", viewBox: `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`, onMouseMove: handleMouseMove, role: "img", "aria-labelledby": "volume-trend-chart-title" },
                React.createElement("title", { id: "volume-trend-chart-title" }, "Évolution du volume musculaire par " + granularity),
                React.createElement("g", { transform: `translate(${margin.left}, ${margin.top})` },
                    // Axes and Grid
                    Array.from({ length: 5 }).map((_, i) => {
                        const y = height * (i / 4);
                        return React.createElement("line", { key: i, className: "grid-line", x1: 0, x2: width, y1: y, y2: y });
                    }),
                    React.createElement("text", { className: "axis-label", x: -5, y: -5, textAnchor: 'end' }, maxSets),
                    React.createElement("text", { className: "axis-label", x: -5, y: height + 3, textAnchor: 'end' }, 0),
                    // Data lines
                    muscleGroups.map((muscle, i) => {
                        if (!visibleMuscles.includes(muscle)) return null;
                        const path = trendData.map((p, j) => `${j === 0 ? 'M' : 'L'} ${getX(p.date)} ${getY(p[muscle])}`).join(' ');
                        return React.createElement("path", { key: muscle, className: "data-line", d: path, stroke: muscleColors[i] });
                    }),
                    // Tooltip line
                    tooltip && React.createElement("line", { stroke: "var(--color-text-secondary)", strokeWidth: "1", strokeDasharray: "3 3", x1: tooltip.x - margin.left, y1: 0, x2: tooltip.x - margin.left, y2: height })
                )
             ),
             tooltip && React.createElement("div", { className: "chart-tooltip visible", style: { left: `${tooltip.x}px`, top: `${tooltip.y}px` } },
                React.createElement("strong", null, tooltip.content.date.toLocaleDateString('fr-FR')),
                Object.entries(tooltip.content).filter(([key]) => key !== 'date' && visibleMuscles.includes(key)).map(([key, value]) => 
                    React.createElement("div", {key: key}, `${key}: ${value}`)
                )
             )
        ),
        React.createElement("div", { className: "stat-card-header" },
            React.createElement("h3", null, "Volume par Muscle"),
            React.createElement(SegmentedControl, {
                options: [{ label: 'Semaine', value: 'week' }, { label: 'Mois', value: 'month' }],
                selected: granularity,
                onChange: (value) => setGranularity(value)
            })
        ),
        React.createElement("div", { className: "muscle-trend-legend" },
            muscleGroups.map((muscle, i) => React.createElement("div", {
                key: muscle,
                className: `legend-item ${visibleMuscles.includes(muscle) ? '' : 'inactive'}`,
                onClick: () => toggleMuscleVisibility(muscle)
            },
                React.createElement("div", { className: "legend-color-dot", style: { backgroundColor: muscleColors[i] } }),
                muscle
            ))
        )
    );
};


const StatisticsView = ({ onSelectExercise, getExercisePR, history }) => {
    const [timeFilter, setTimeFilter] = useState('30d');
    const hasHistory = Object.keys(history).length > 0;

    const { currentPeriodStats, previousPeriodStats } = useMemo(() => {
        const calculateStats = (historySlice) => {
            const stats = {
                totalWorkouts: 0,
                totalVolume: 0,
                totalSets: 0,
                muscleDistribution: {},
            };
            historySlice.forEach((workout) => {
                stats.totalWorkouts++;
                (workout.exercises || []).forEach((exo) => {
                    const processExo = (subExo) => {
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
                    if (exo.type === 'superset') (exo.exercises || []).forEach(processExo); // Check for 'type' property
                    else processExo(exo);
                });
            });
            return stats;
        };

        if (timeFilter === 'all') {
            const allHistory = Object.values(history);
            return { currentPeriodStats: calculateStats(allHistory), previousPeriodStats: calculateStats([]) };
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
        return React.createElement("div", { className: "main-content" }, React.createElement("div", { className: "empty-stat" }, "Commencez à vous entraîner pour voir vos statistiques."));
    }
    
    return (
      React.createElement("div", { className: "main-content" },
        React.createElement("h2", { className: "stats-header" }, "Tableau de Bord"),
        React.createElement(SegmentedControl, {
            options: [
                { label: '30 Jours', value: '30d' },
                { label: '90 Jours', value: '90d' },
                { label: 'Tout', value: 'all' }
            ],
            selected: timeFilter,
            onChange: (value) => setTimeFilter(value),
            className: 'main-filter'
        }),
        React.createElement("div", { className: "stats-dashboard" },
            React.createElement("div", { className: "stat-card" },
                React.createElement("h3", null, "Vue d'ensemble"),
                React.createElement(KPICards, { stats: currentPeriodStats }),
                React.createElement(SevenDayStreak, { history: history })
            ),
            React.createElement("div", { className: "stat-card" },
                React.createElement("h3", null, "Muscles Sollicités (7 derniers jours)"),
                React.createElement(AnatomyChart, { history: history })
            ),
            React.createElement("div", { className: "stat-card" },
                 React.createElement("h3", null, "Répartition Musculaire"),
                 React.createElement(MuscleRadarChart, { currentStats: currentPeriodStats.muscleDistribution, previousStats: previousPeriodStats.muscleDistribution })
            ),
             React.createElement("div", { className: "stat-card" },
                React.createElement(MuscleVolumeTrendChart, { history: history })
            ),
            React.createElement("div", { className: "stat-card" },
                 React.createElement("h3", null, "Progression des Charges"),
                 programData.stats.projections.map(exo => 
                    React.createElement("div", { 
                        key: exo.id, 
                        className: "stat-card clickable", 
                        onClick: () => onSelectExercise(exo.id) 
                    },
                        React.createElement("h4", null, exo.name),
                        React.createElement(ProgressionChart, { exerciseId: exo.id, exerciseName: exo.name, history: history })
                    )
                )
            )
        )
      )
    );
};

const PRCard = ({ label, value, unit }) => {
    return React.createElement("div", { className: "pr-card" },
        React.createElement("div", { className: "pr-value" }, value, " ", unit),
        React.createElement("div", { className: "pr-label" }, label)
    );
};

const ExerciseHistoryList = ({ exerciseHistory }) => {
    if (!exerciseHistory || exerciseHistory.length === 0) {
        return React.createElement("p", { className: "empty-stat-small" }, "Aucun historique trouvé pour cet exercice.");
    }

    return React.createElement("div", { className: "exercise-history-list" },
        exerciseHistory.map((workoutEntry, index) =>
            React.createElement("div", { className: "history-workout-item", key: index },
                React.createElement("div", { className: "date" }, workoutEntry.date.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })),
                workoutEntry.sets.map((set, setIndex) =>
                    React.createElement("div", { className: "history-set-item", key: setIndex },
                        React.createElement("span", { className: "set-details" }, `${set.weight} kg x ${set.reps}`),
                        React.createElement("span", { className: "rir" }, `RIR ${set.rir}`)
                    )
                )
            )
        )
    );
};

const ExerciseDetailView = ({ exerciseId, onBack, history, getExercisePR, getBestSetVolume, getMostReps, getProjected1RM, getWorkoutHistoryForExercise }) => {
    const [activeTab, setActiveTab] = useState('summary');

    const exercise = useMemo(() => {
        for (const day in programData.workouts) {
            for (const exo of programData.workouts[day].exercises) {
                if (exo.type === 'superset') { // Check for 'type' property
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

    return React.createElement("div", { className: "exercise-detail-view" },
        React.createElement("div", { className: "detail-header" },
            React.createElement("button", { className: "back-btn", onClick: onBack, "aria-label": "Retour au tableau de bord" }, React.createElement(ChevronLeftIcon, null)),
            React.createElement("h2", { className: "detail-title" }, exerciseName)
        ),
        React.createElement("div", { className: "detail-tabs" },
            React.createElement("button", { className: `detail-tab ${activeTab === 'summary' ? 'active' : ''}`, onClick: () => setActiveTab('summary') }, "Résumé"),
            React.createElement("button", { className: `detail-tab ${activeTab === 'history' ? 'active' : ''}`, onClick: () => setActiveTab('history') }, "Historique")
        ),
        React.createElement("div", { className: "detail-content" },
            activeTab === 'summary' && React.createElement(React.Fragment, null,
                React.createElement("div", { className: "stat-card" },
                    React.createElement("h3", null, "Progression des Charges"),
                    React.createElement(ProgressionChart, { exerciseId: exerciseId, exerciseName: exerciseName, history: history })
                ),
                React.createElement("div", { className: "pr-section" },
                    React.createElement("h3", null, "Records Personnels"),
                    React.createElement("div", { className: "pr-grid" },
                        React.createElement(PRCard, { label: "Poids le + Lourd", value: getExercisePR(exerciseId).weight, unit: "kg" }),
                        React.createElement(PRCard, { label: "1RM Projeté", value: getProjected1RM(exerciseId), unit: "kg" }),
                        React.createElement(PRCard, { label: "Meilleure Série", value: getBestSetVolume(exerciseId), unit: "kg" }),
                        React.createElement(PRCard, { label: "+ de Répétitions", value: getMostReps(exerciseId), unit: "reps" })
                    )
                )
            ),
            activeTab === 'history' && React.createElement(ExerciseHistoryList, { exerciseHistory: exerciseHistory })
        )
    );
};


const ExerciseCard = ({ exercise }) => {
    if (exercise.type === 'superset') { // Check for 'type' property
        const supersetBlock = exercise;
        const firstExercise = supersetBlock.exercises.length > 0 ? supersetBlock.exercises[0] : null;
        const secondExercise = supersetBlock.exercises.length > 1 ? supersetBlock.exercises[1] : null;

        return React.createElement("div", { className: "superset-card" },
            React.createElement("div", { className: "superset-badge" }, "SUPERSET"),
            React.createElement("div", { className: "superset-exercises" },
                firstExercise && React.createElement(React.Fragment, null,
                    React.createElement("div", { className: "superset-exercise-item" },
                        React.createElement("h4", null, firstExercise.name),
                        React.createElement("div", { className: "sets-reps" }, firstExercise.sets, " × ", firstExercise.reps)
                    ),
                    secondExercise && React.createElement("div", { className: "superset-plus-icon" }, React.createElement(PlusIcon, null)),
                    secondExercise && React.createElement("div", { className: "superset-exercise-item" },
                        React.createElement("h4", null, secondExercise.name),
                        React.createElement("div", { className: "sets-reps" }, secondExercise.sets, " × ", secondExercise.reps)
                    )
                )
            ),
            React.createElement("div", { className: "exercise-details" }, "Repos: ", supersetBlock.rest, "s après le duo")
        );
    }
    const baseExercise = exercise;
    return React.createElement("div", { className: "exercise-card" }, 
        React.createElement("div", { className: "exercise-header" }, 
            React.createElement("h4", null, baseExercise.name), 
            React.createElement("div", { className: "sets-reps" }, baseExercise.sets, " × ", baseExercise.reps)
        ), 
        React.createElement("div", { className: "exercise-details" }, 
            React.createElement("span", null, "RIR ", baseExercise.rir, " | Repos: ", baseExercise.rest, "s")
        )
    );
};

const WorkoutPlannerView = ({ onStartWorkout }) => {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(() => { const dayIndex = new Date().getDay(); const dayMap = {0: 'dimanche', 2: 'mardi', 4: 'jeudi', 5: 'vendredi'}; return dayMap[dayIndex] || 'dimanche'; });

  const { currentBlock, isDeload } = useMemo(() => {
    if (programData.deloadWeeks.includes(currentWeek)) return { isDeload: true, currentBlock: { id: -1, name: `SEMAINE ${currentWeek}: DELOAD`, weeks: [], technique: { name: "Récupération", desc: "Charges réduites, RPE 5-6." } } };
    const block = programData.blocks.find(b => b.weeks.includes(currentWeek)) || { id: 0, name: "Phase Initiale", weeks: [], technique: { name: "Technique", desc: "Concentration sur la forme." } };
    return { isDeload: false, currentBlock: block };
  }, [currentWeek]);
  
  const gymWorkout = useMemo(() => {
    const originalWorkout = programData.workouts[activeDay];
    if (!originalWorkout) return null;
    let workout = JSON.parse(JSON.stringify(originalWorkout));
    const getBicepsName = (w) => { const b = programData.blocks.find(bl => bl.weeks.includes(w))?.id; return (b === 1 || b === 3) ? 'Incline Curl' : 'Spider Curl'; };
    workout.exercises.forEach((exo) => {
        // Use property check for 'type' to narrow down exercise type
        if (exo.type === 'superset') { // Check for 'type' property
            const supersetBlock = exo;
            supersetBlock.exercises.forEach((subExo) => {
                if (subExo.bicepsRotation) { // bicepsRotation is optional
                    subExo.name = getBicepsName(currentWeek); 
                }
            });
        } else {
            const baseExercise = exo;
            if (baseExercise.bicepsRotation) { // bicepsRotation is optional
                baseExercise.name = getBicepsName(currentWeek);
            }
        }
    });
    return workout;
  }, [activeDay, currentWeek]);

  const homeWorkout = programData.homeWorkouts[activeDay];

  return (
    React.createElement("div", { className: "main-content" },
      React.createElement("header", { className: "header" }, React.createElement("h1", null, "Programme d'Entraînement")),
      React.createElement("div", { className: "week-navigator" }, React.createElement("button", { onClick: () => setCurrentWeek(w => Math.max(1, w - 1)), disabled: currentWeek === 1, "aria-label": "Semaine précédente" }, "<"), React.createElement("div", { className: "week-display" }, "Semaine ", currentWeek), React.createElement("button", { onClick: () => setCurrentWeek(w => Math.min(26, w + 1)), disabled: currentWeek === 26, "aria-label": "Semaine suivante" }, ">")),
      React.createElement("div", { className: "block-info" }, React.createElement("h3", null, currentBlock.name), React.createElement("p", null, React.createElement("strong", null, "Technique :"), " ", currentBlock.technique.desc)),
      React.createElement("div", { className: "tabs" }, ['dimanche', 'mardi', 'jeudi', 'vendredi'].map(day => React.createElement("button", { key: day, className: `tab ${activeDay === day ? 'active' : ''}`, onClick: () => setActiveDay(day), "aria-selected": activeDay === day }, day.charAt(0).toUpperCase() + day.slice(1)))),
      React.createElement(MuscleGroupHeatmap, { workout: gymWorkout || (homeWorkout ? { name: "Séance Maison", exercises: [homeWorkout] } : null) }),
      React.createElement("div", { className: "workout-overview" },
        gymWorkout && React.createElement(React.Fragment, null, 
          React.createElement("button", { className: "start-session-btn", onClick: () => onStartWorkout(gymWorkout, currentWeek, activeDay), disabled: isDeload }, isDeload ? 'Jour de repos / Deload' : `Commencer - ${gymWorkout.name}`),
          gymWorkout.exercises.map((exo, index) => React.createElement(ExerciseCard, { key: exo.id || `superset-${index}`, exercise: exo }))
        ),
        homeWorkout && React.createElement("div", { className: "home-workout-card" }, React.createElement("div", null, React.createElement("h4", null, "🏠 Séance à la Maison"), React.createElement("p", null, homeWorkout.name, " - ", homeWorkout.sets, " × ", homeWorkout.reps)), React.createElement("button", { className: "start-home-btn", onClick: () => onStartWorkout({ name: "Séance Maison", exercises: [homeWorkout] }, currentWeek, activeDay, true) }, "Démarrer")),
        !gymWorkout && activeDay === 'jeudi' && React.createElement("p",{style:{textAlign:'center', marginTop:'2rem'}},"Séance à la maison uniquement aujourd'hui."),
        !gymWorkout && !homeWorkout && !programData.homeWorkouts[activeDay] && React.createElement("p", { style: { textAlign: 'center', marginTop: '2rem' } }, "Jour de repos.")
      )
    )
  );
};

const BottomNav = ({ currentView, setView }) => (
    React.createElement("nav", { className: "bottom-nav" }, React.createElement("button", { className: `nav-item ${currentView === 'stats' ? 'active' : ''}`, onClick: () => setView('stats') }, React.createElement(ChartIcon, null), React.createElement("span", null, "Stats")), React.createElement("button", { className: `nav-item ${currentView === 'program' ? 'active' : ''}`, onClick: () => setView('program') }, React.createElement(DumbbellIcon, null), React.createElement("span", null, "Programme")))
);

// --- MAIN APP COMPONENT ---
const App = () => {
  const [currentView, setCurrentView] = useState('stats');
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);

  const { history, saveWorkout, getExercisePR, getSuggestedWeight, getBestSetVolume, getMostReps, getProjected1RM, getWorkoutHistoryForExercise } = useWorkoutHistory();
  
  const handleStartWorkout = (workout, week, day, isHomeWorkout = false) => { setActiveWorkout({ workout, meta: { week, day, isHomeWorkout }, startTime: Date.now() }); };
  const handleEndWorkout = (completedWorkout) => {
    if (completedWorkout && activeWorkout) {
        saveWorkout({ 
            date: new Date().toISOString(), 
            ...activeWorkout.meta,
            exercises: completedWorkout.exercises 
        });
    }
    setActiveWorkout(null);
  };

  const handleSelectExercise = (id) => {
      setSelectedExerciseId(id);
  };

  const handleDeselectExercise = () => {
      setSelectedExerciseId(null);
  };

  const renderContent = () => {
    if (activeWorkout) {
        return React.createElement(ActiveWorkoutView, { 
            key: activeWorkout.startTime, 
            workout: activeWorkout.workout, 
            meta: activeWorkout.meta, 
            onEndWorkout: handleEndWorkout, 
            getSuggestedWeight: getSuggestedWeight 
        });
    }
    if (selectedExerciseId) {
        return React.createElement(ExerciseDetailView, {
            exerciseId: selectedExerciseId,
            onBack: handleDeselectExercise,
            history: history,
            getExercisePR: getExercisePR,
            getBestSetVolume: getBestSetVolume,
            getMostReps: getMostReps,
            getProjected1RM: getProjected1RM,
            getWorkoutHistoryForExercise: getWorkoutHistoryForExercise
        });
    }
    switch (currentView) {
      case 'program':
        return React.createElement(WorkoutPlannerView, { onStartWorkout: handleStartWorkout });
      case 'stats':
        return React.createElement(StatisticsView, { onSelectExercise: handleSelectExercise, getExercisePR: getExercisePR, history: history });
      default:
        return React.createElement(StatisticsView, { onSelectExercise: handleSelectExercise, getExercisePR: getExercisePR, history: history });
    }
  };

  return (
    React.createElement("div", { className: "app-container" },
      renderContent(),
      !activeWorkout && !selectedExerciseId && React.createElement(BottomNav, { currentView: currentView, setView: setCurrentView })
    )
  );
};

// --- RENDER APP ---
const container = document.getElementById('root');
if(container) { createRoot(container).render(React.createElement(App, null)); }
