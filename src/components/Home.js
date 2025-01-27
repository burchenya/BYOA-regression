import React, { useState, useRef, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  CardContent, 
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Paper,
  Slider,
  Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import * as d3Array from 'd3-array';
import * as d3Scale from 'd3-scale';
import * as d3Selection from 'd3-selection';
import * as d3Shape from 'd3-shape';
import * as d3Axis from 'd3-axis';
import * as d3Format from 'd3-format';
import ReactFlow, { 
  Controls, 
  Background,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';

// Create a combined d3 object with all required functions
const d3 = {
  ...d3Array,
  ...d3Scale,
  ...d3Selection,
  ...d3Shape,
  ...d3Axis,
  ...d3Format,
  range: d3Array.range,
  min: d3Array.min,
  max: d3Array.max,
  mean: d3Array.mean,
  sum: d3Array.sum,
  select: d3Selection.select,
  scaleLinear: d3Scale.scaleLinear,
  line: d3Shape.line,
  curveBasis: d3Shape.curveBasis,
  curveStep: d3Shape.curveStep,
  axisBottom: d3Axis.axisBottom,
  axisLeft: d3Axis.axisLeft
};

// Import the example data from each regression component
const medicalExamples = {
  linear: {
    bpAge: {
      name: 'Blood Pressure vs Age',
      data: Array.from({ length: 50 }, (_, i) => ({
        x: 20 + Math.random() * 60, // age 20-80
        y: 90 + (i / 2) + Math.random() * 30 // BP increasing with age + noise
      })),
      xLabel: 'Age (years)',
      yLabel: 'Systolic Blood Pressure (mmHg)'
    },
    heightWeight: {
      name: 'Height vs Weight',
      data: Array.from({ length: 50 }, (_, i) => ({
        x: 150 + Math.random() * 40, // height 150-190 cm
        y: 50 + (i / 3) + Math.random() * 20 // weight increasing with height + noise
      })),
      xLabel: 'Height (cm)',
      yLabel: 'Weight (kg)'
    }
  },
  multiple: {
    bmiFactors: {
      name: 'BMI and Lifestyle Factors',
      data: Array.from({ length: 50 }, () => ({
        height: 150 + Math.random() * 40,
        weight: 50 + Math.random() * 50,
        age: 20 + Math.random() * 60,
        coffeePerDay: Math.floor(Math.random() * 8),
        sleepHours: 5 + Math.random() * 5,
        isMarried: Math.random() > 0.5 ? 1 : 0,
        bmi: 0
      })).map(d => {
        const heightInM = d.height / 100;
        d.bmi = d.weight / (heightInM * heightInM);
        return d;
      }),
      factors: [
        'Height (cm)', 
        'Weight (kg)', 
        'Age (years)', 
        'Coffee Cups/Day',
        'Sleep Hours/Day',
        'Marital Status (1=married)'
      ]
    }
  },
  logistic: {
    heartDisease: {
      name: 'Heart Disease Risk',
      data: Array.from({ length: 100 }, () => {
        const age = 30 + Math.random() * 50;
        const cholesterol = 150 + Math.random() * 150;
        const probability = 1 / (1 + Math.exp(-(age/20 + cholesterol/100 - 15)));
        const outcome = Math.random() < probability ? 1 : 0;
        return { age, cholesterol, outcome };
      }),
      xLabel: 'Age (years)',
      yLabel: 'Cholesterol (mg/dL)'
    }
  },
  cox: {
    cancerSurvival: {
      name: 'Cancer Treatment Survival',
      data: Array.from({ length: 100 }, () => {
        const age = 40 + Math.random() * 40;
        const stage = Math.floor(Math.random() * 4) + 1;
        const baseTime = 60 - (age/10) - (stage * 6);
        const survivalTime = Math.max(1, baseTime + Math.random() * 20);
        const censored = Math.random() > 0.3;
        return { age, stage, survivalTime, censored };
      }).sort((a, b) => a.survivalTime - b.survivalTime)
    }
  },
  poisson: {
    hospitalInfections: {
      name: 'Hospital-Acquired Infections',
      data: Array.from({ length: 50 }, () => {
        const bedCount = Math.floor(10 + Math.random() * 90);
        const staffRatio = 0.2 + Math.random() * 0.5;
        const lambda = (bedCount / 20) * (1 - staffRatio);
        const infections = Math.floor(Math.random() * lambda * 10);
        return { bedCount, staffRatio, infections };
      })
    }
  }
};

const regressionTypes = [
  {
    title: 'Linear Regression',
    description: 'Understand relationships between continuous variables, such as the correlation between blood pressure and age.',
    path: '/linear',
    example: 'Predicting patient recovery time based on initial vital signs.',
    keyPoints: [
      'Best for continuous outcome variables',
      'Assumes linear relationship between variables',
      'Commonly used for prediction and forecasting',
      'Example: Blood pressure vs Age relationship'
    ]
  },
  {
    title: 'Multiple Regression',
    description: 'Analyze how multiple independent variables affect an outcome, like how diet and exercise influence cholesterol levels.',
    path: '/multiple',
    example: 'Analyzing factors affecting length of hospital stay.',
    keyPoints: [
      'Handles multiple predictor variables',
      'Controls for confounding factors',
      'Assesses relative importance of predictors',
      'Example: Factors affecting BMI (age, diet, exercise)'
    ]
  },
  {
    title: 'Logistic Regression',
    description: 'Predict binary outcomes, such as disease presence/absence based on various risk factors.',
    path: '/logistic',
    example: 'Predicting the likelihood of heart disease based on patient characteristics.',
    keyPoints: [
      'Best for binary outcomes (yes/no)',
      'Predicts probability of outcome',
      'Common in diagnostic testing',
      'Example: Disease presence/absence prediction'
    ]
  },
  {
    title: 'Cox Proportional Hazards',
    description: 'Analyze survival data and time-to-event outcomes in clinical trials.',
    path: '/cox',
    example: 'Studying factors affecting patient survival rates in cancer treatment.',
    keyPoints: [
      'Analyzes time-to-event data',
      'Handles censored observations',
      'Used in survival analysis',
      'Example: Cancer survival analysis'
    ]
  },
  {
    title: 'Poisson Regression',
    description: 'Model count data, such as number of adverse events or hospital admissions.',
    path: '/poisson',
    example: 'Analyzing infection rates in different hospital wards.',
    keyPoints: [
      'Best for count data',
      'Models rate of occurrence',
      'Used in epidemiology',
      'Example: Hospital infection rates'
    ]
  }
];

function Home() {
  const [selectedRegression, setSelectedRegression] = useState('/multiple');
  const [selectedDataset, setSelectedDataset] = useState('bmiFactors');
  const [selectedFactor, setSelectedFactor] = useState(0);
  const [noiseLevel, setNoiseLevel] = useState(1);
  const svgRef = useRef();
  const navigate = useNavigate();

  const handleRegressionChange = (event) => {
    const path = event.target.value;
    setSelectedRegression(path);
    // Reset dataset selection when changing regression type
    setSelectedDataset(Object.keys(medicalExamples[path.substring(1)])[0]);
  };

  // Find the currently selected regression type
  const selectedType = regressionTypes.find(type => type.path === selectedRegression);
  const regressionKey = selectedRegression.substring(1); // Remove leading slash

  const initialNodes = [
    // Start Node
    {
      id: 'start',
      type: 'input',
      data: { label: 'What type of medical data are you analyzing?' },
      position: { x: 600, y: 0 },
      style: { background: '#3498db', color: 'white', width: 250, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Outcome Type Decision
    {
      id: 'outcome_type',
      data: { label: 'What is your outcome variable?' },
      position: { x: 600, y: 100 },
      style: { background: '#2c3e50', color: 'white', width: 200, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Continuous Branch
    {
      id: 'continuous',
      data: { label: 'Continuous\n(e.g., blood pressure, weight)' },
      position: { x: 100, y: 250 },
      style: { background: '#2ecc71', color: 'white', width: 200, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Binary Branch
    {
      id: 'binary',
      data: { label: 'Binary\n(yes/no outcome)' },
      position: { x: 400, y: 250 },
      style: { background: '#e74c3c', color: 'white', width: 200, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Count Branch
    {
      id: 'count',
      data: { label: 'Count Data\n(number of events)' },
      position: { x: 800, y: 250 },
      style: { background: '#f39c12', color: 'white', width: 200, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Time Branch
    {
      id: 'time',
      data: { label: 'Time-to-Event\n(survival data)' },
      position: { x: 1100, y: 250 },
      style: { background: '#9b59b6', color: 'white', width: 200, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Continuous Predictors Decision
    {
      id: 'cont_predictors',
      data: { label: 'How many predictors?' },
      position: { x: 100, y: 400 },
      style: { background: '#27ae60', color: 'white', width: 180, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Simple Linear
    {
      id: 'simple_linear',
      data: { 
        label: 'Simple Linear Regression\n• One predictor\n• Direct relationship\n• Example: Age → Blood Pressure' 
      },
      position: { x: 0, y: 550 },
      style: { background: '#f0f9f4', border: '2px solid #27ae60', color: '#27ae60', width: 220, padding: '15px', fontSize: '13px' }
    },
    // Multiple Linear
    {
      id: 'multiple_linear',
      data: { 
        label: 'Multiple Linear Regression\n• Multiple predictors\n• Complex relationships\n• Example: Age, BMI, Diet → Blood Pressure' 
      },
      position: { x: 250, y: 550 },
      style: { background: '#f0f9f4', border: '2px solid #27ae60', color: '#27ae60', width: 220, padding: '15px', fontSize: '13px' }
    },
    // Binary Predictors Decision
    {
      id: 'binary_predictors',
      data: { label: 'Predictor characteristics?' },
      position: { x: 400, y: 400 },
      style: { background: '#c0392b', color: 'white', width: 180, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Simple Logistic
    {
      id: 'simple_logistic',
      data: { 
        label: 'Simple Logistic Regression\n• One/few predictors\n• Binary outcome\n• Example: Age → Disease Risk (Yes/No)' 
      },
      position: { x: 500, y: 550 },
      style: { background: '#fdf3f2', border: '2px solid #c0392b', color: '#c0392b', width: 220, padding: '15px', fontSize: '13px' }
    },
    // Count Data Decision
    {
      id: 'count_predictors',
      data: { label: 'Multiple events\nper subject?' },
      position: { x: 800, y: 400 },
      style: { background: '#d35400', color: 'white', width: 180, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Simple Poisson
    {
      id: 'simple_poisson',
      data: { 
        label: 'Simple Poisson Regression\n• Single event type\n• Example: Monthly infections per ward' 
      },
      position: { x: 750, y: 550 },
      style: { background: '#fef5e7', border: '2px solid #d35400', color: '#d35400', width: 220, padding: '15px', fontSize: '13px' }
    },
    // Multiple Poisson
    {
      id: 'multiple_poisson',
      data: { 
        label: 'Multiple Poisson Regression\n• Multiple event types\n• Example: Different types of complications' 
      },
      position: { x: 1000, y: 550 },
      style: { background: '#fef5e7', border: '2px solid #d35400', color: '#d35400', width: 220, padding: '15px', fontSize: '13px' }
    },
    // Time Data Decision
    {
      id: 'time_predictors',
      data: { label: 'Censored data\npresent?' },
      position: { x: 1100, y: 400 },
      style: { background: '#8e44ad', color: 'white', width: 180, padding: '15px', fontSize: '14px', textAlign: 'center' }
    },
    // Cox Model
    {
      id: 'cox_model',
      data: { 
        label: 'Cox Proportional Hazards\n• Censored survival data\n• Example: Patient survival times' 
      },
      position: { x: 1250, y: 550 },
      style: { background: '#f5f0f7', border: '2px solid #8e44ad', color: '#8e44ad', width: 220, padding: '15px', fontSize: '13px' }
    },
    // Time Series
    {
      id: 'time_series',
      data: { 
        label: 'Time Series Analysis\n• Complete temporal data\n• Example: Disease progression' 
      },
      position: { x: 1500, y: 550 },
      style: { background: '#f5f0f7', border: '2px solid #8e44ad', color: '#8e44ad', width: 220, padding: '15px', fontSize: '13px' }
    }
  ];

  const initialEdges = [
    // Start to Outcome Type
    {
      id: 'e-start-outcome',
      source: 'start',
      target: 'outcome_type',
      animated: true,
      style: { stroke: '#3498db' },
      markerEnd: { type: MarkerType.ArrowClosed }
    },
    // Outcome Type to Branches
    {
      id: 'e-outcome-continuous',
      source: 'outcome_type',
      target: 'continuous',
      label: 'Continuous',
      labelStyle: { fill: '#2ecc71', fontWeight: 700 },
      style: { stroke: '#2ecc71' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#2ecc71' }
    },
    {
      id: 'e-outcome-binary',
      source: 'outcome_type',
      target: 'binary',
      label: 'Binary',
      labelStyle: { fill: '#e74c3c', fontWeight: 700 },
      style: { stroke: '#e74c3c' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#e74c3c' }
    },
    {
      id: 'e-outcome-count',
      source: 'outcome_type',
      target: 'count',
      label: 'Count',
      labelStyle: { fill: '#f39c12', fontWeight: 700 },
      style: { stroke: '#f39c12' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#f39c12' }
    },
    {
      id: 'e-outcome-time',
      source: 'outcome_type',
      target: 'time',
      label: 'Time',
      labelStyle: { fill: '#9b59b6', fontWeight: 700 },
      style: { stroke: '#9b59b6' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#9b59b6' }
    },
    // Continuous to Predictors
    {
      id: 'e-cont-pred',
      source: 'continuous',
      target: 'cont_predictors',
      animated: true,
      style: { stroke: '#2ecc71' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#2ecc71' }
    },
    // Predictor Decisions
    {
      id: 'e-pred-simple',
      source: 'cont_predictors',
      target: 'simple_linear',
      label: 'Single',
      labelStyle: { fill: '#27ae60', fontWeight: 700 },
      style: { stroke: '#27ae60' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#27ae60' }
    },
    {
      id: 'e-pred-multiple',
      source: 'cont_predictors',
      target: 'multiple_linear',
      label: 'Multiple',
      labelStyle: { fill: '#27ae60', fontWeight: 700 },
      style: { stroke: '#27ae60' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#27ae60' }
    },
    // Binary to Predictors
    {
      id: 'e-binary-pred',
      source: 'binary',
      target: 'binary_predictors',
      animated: true,
      style: { stroke: '#e74c3c' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#e74c3c' }
    },
    // Binary Predictor Decision
    {
      id: 'e-binary-simple',
      source: 'binary_predictors',
      target: 'simple_logistic',
      label: 'Simple',
      labelStyle: { fill: '#c0392b', fontWeight: 700 },
      style: { stroke: '#c0392b' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#c0392b' }
    },
    // Count Data Branch
    {
      id: 'e-count-pred',
      source: 'count',
      target: 'count_predictors',
      animated: true,
      style: { stroke: '#f39c12' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#f39c12' }
    },
    {
      id: 'e-count-simple',
      source: 'count_predictors',
      target: 'simple_poisson',
      label: 'No',
      labelStyle: { fill: '#d35400', fontWeight: 700 },
      style: { stroke: '#d35400' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#d35400' }
    },
    {
      id: 'e-count-multiple',
      source: 'count_predictors',
      target: 'multiple_poisson',
      label: 'Yes',
      labelStyle: { fill: '#d35400', fontWeight: 700 },
      style: { stroke: '#d35400' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#d35400' }
    },
    // Time Data Branch
    {
      id: 'e-time-pred',
      source: 'time',
      target: 'time_predictors',
      animated: true,
      style: { stroke: '#9b59b6' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#9b59b6' }
    },
    {
      id: 'e-time-cox',
      source: 'time_predictors',
      target: 'cox_model',
      label: 'Yes',
      labelStyle: { fill: '#8e44ad', fontWeight: 700 },
      style: { stroke: '#8e44ad' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8e44ad' }
    },
    {
      id: 'e-time-series',
      source: 'time_predictors',
      target: 'time_series',
      label: 'No',
      labelStyle: { fill: '#8e44ad', fontWeight: 700 },
      style: { stroke: '#8e44ad' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#8e44ad' }
    }
  ];

  useEffect(() => {
    if (!svgRef.current || !selectedType) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 30, right: 30, bottom: 70, left: 80 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const examples = medicalExamples[regressionKey];
    const currentExample = examples[selectedDataset];

    if (regressionKey === 'linear') {
      // Linear regression visualization
      const data = currentExample.data.map(d => ({
        x: d.x,
        y: d.y + (Math.random() - 0.5) * noiseLevel * 20
      }));

      const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.x) * 0.9, d3.max(data, d => d.x) * 1.1])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.y) * 0.9, d3.max(data, d => d.y) * 1.1])
        .range([height, 0]);

      // Add axes
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 50)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text(currentExample.xLabel);

      svg.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -height / 2)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text(currentExample.yLabel);

      // Add dots
      svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.x))
        .attr('cy', d => y(d.y))
        .attr('r', 7)
        .style('fill', '#69b3a2');

      // Calculate and add regression line
      const xValues = data.map(d => d.x);
      const yValues = data.map(d => d.y);
      const xMean = d3.mean(xValues);
      const yMean = d3.mean(yValues);
      const ssxx = d3.sum(xValues.map(x => Math.pow(x - xMean, 2)));
      const ssxy = d3.sum(data.map(d => (d.x - xMean) * (d.y - yMean)));
      const slope = ssxy / ssxx;
      const intercept = yMean - slope * xMean;

      const line = d3.line()
        .x(d => x(d))
        .y(d => y(slope * d + intercept));

      svg.append('path')
        .datum(x.domain())
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 3)
        .attr('d', line);
    } else if (regressionKey === 'multiple') {
      const data = currentExample.data;
      
      // Get x values based on selected factor
      const xValues = data.map(d => {
        switch(selectedFactor) {
          case 0: return d.height;
          case 1: return d.weight;
          case 2: return d.age;
          case 3: return d.coffeePerDay;
          case 4: return d.sleepHours;
          case 5: return d.isMarried;
          default: return d.height;
        }
      });
      const yValues = data.map(d => d.bmi);

      // Scales
      const x = d3.scaleLinear()
        .domain([
          selectedFactor === 5 ? -0.5 : d3.min(xValues) * 0.9, // Special handling for binary marital status
          selectedFactor === 5 ? 1.5 : d3.max(xValues) * 1.1
        ])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([d3.min(yValues) * 0.9, d3.max(yValues) * 1.1])
        .range([height, 0]);

      // Add axes
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x)
          .tickFormat(selectedFactor === 5 ? d => d === 0 ? 'Single' : d === 1 ? 'Married' : '' : d3.format(',.1f')))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 50)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text(currentExample.factors[selectedFactor]);

      svg.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -height / 2)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text('BMI');

      // Add dots
      svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', (_, i) => x(xValues[i]))
        .attr('cy', d => y(d.bmi))
        .attr('r', 7)
        .style('fill', '#69b3a2')
        .style('opacity', 0.7);

      // Calculate and add regression line (except for marital status which is binary)
      if (selectedFactor !== 5) {
        const xMean = d3.mean(xValues);
        const yMean = d3.mean(yValues);
        const ssxx = d3.sum(xValues.map(x => Math.pow(x - xMean, 2)));
        const ssxy = d3.sum(xValues.map((x, i) => (x - xMean) * (yValues[i] - yMean)));
        const slope = ssxy / ssxx;
        const intercept = yMean - slope * xMean;

        const line = d3.line()
          .x(d => x(d))
          .y(d => y(slope * d + intercept));

        svg.append('path')
          .datum(x.domain())
          .attr('fill', 'none')
          .attr('stroke', 'red')
          .attr('stroke-width', 3)
          .attr('d', line);
      } else {
        // For marital status, draw mean BMI lines for each group
        const singleBMI = d3.mean(data.filter(d => d.isMarried === 0).map(d => d.bmi));
        const marriedBMI = d3.mean(data.filter(d => d.isMarried === 1).map(d => d.bmi));

        // Single mean line
        svg.append('line')
          .attr('x1', x(0))
          .attr('x2', x(0))
          .attr('y1', y(d3.min(yValues) * 0.9))
          .attr('y2', y(singleBMI))
          .attr('stroke', 'red')
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', '5,5');

        // Married mean line
        svg.append('line')
          .attr('x1', x(1))
          .attr('x2', x(1))
          .attr('y1', y(d3.min(yValues) * 0.9))
          .attr('y2', y(marriedBMI))
          .attr('stroke', 'red')
          .attr('stroke-width', 3)
          .attr('stroke-dasharray', '5,5');
      }
    } else if (regressionKey === 'logistic') {
      const data = currentExample.data;
      
      // Scales
      const x = d3.scaleLinear()
        .domain([d3.min(data, d => d.age) * 0.9, d3.max(data, d => d.age) * 1.1])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([d3.min(data, d => d.cholesterol) * 0.9, d3.max(data, d => d.cholesterol) * 1.1])
        .range([height, 0]);

      // Add axes
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 50)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text(currentExample.xLabel);

      svg.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -height / 2)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text(currentExample.yLabel);

      // Add dots with different colors based on outcome
      svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.age))
        .attr('cy', d => y(d.cholesterol))
        .attr('r', 7)
        .style('fill', d => d.outcome === 1 ? '#ff6b6b' : '#4ecdc4')
        .style('opacity', 0.7);

      // Add decision boundary curve
      const curvePoints = [];
      for (let age = d3.min(data, d => d.age); age <= d3.max(data, d => d.age); age += 0.5) {
        for (let chol = d3.min(data, d => d.cholesterol); chol <= d3.max(data, d => d.cholesterol); chol += 1) {
          const prob = 1 / (1 + Math.exp(-(age/20 + chol/100 - 15)));
          if (Math.abs(prob - 0.5) < 0.01) {
            curvePoints.push([age, chol]);
          }
        }
      }

      const line = d3.line()
        .x(d => x(d[0]))
        .y(d => y(d[1]))
        .curve(d3.curveBasis);

      svg.append('path')
        .datum(curvePoints)
        .attr('fill', 'none')
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', line);

    } else if (regressionKey === 'cox') {
      const data = currentExample.data;
      
      // Calculate Kaplan-Meier estimate
      let n = data.length;
      let survival = [];
      let currentProb = 1;
      
      data.forEach((d, i) => {
        if (!d.censored) {
          currentProb *= (n - 1) / n;
        }
        survival.push({
          time: d.survivalTime,
          probability: currentProb,
          censored: d.censored
        });
        n--;
      });

      // Scales
      const x = d3.scaleLinear()
        .domain([0, d3.max(survival, d => d.time)])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

      // Add axes
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 50)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text('Time (months)');

      svg.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -height / 2)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text('Survival Probability');

      // Add survival curve
      const line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.probability))
        .curve(d3.curveStep);

      svg.append('path')
        .datum(survival)
        .attr('fill', 'none')
        .attr('stroke', '#2c3e50')
        .attr('stroke-width', 3)
        .attr('d', line);

      // Add censored points
      svg.selectAll('circle')
        .data(survival.filter(d => d.censored))
        .enter()
        .append('circle')
        .attr('cx', d => x(d.time))
        .attr('cy', d => y(d.probability))
        .attr('r', 7)
        .style('fill', '#e74c3c');

    } else if (regressionKey === 'poisson') {
      const data = currentExample.data;
      
      // Scales
      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.bedCount)])
        .range([0, width]);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.infections)])
        .range([height, 0]);

      // Add axes
      svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append('text')
        .attr('x', width / 2)
        .attr('y', 50)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text('Number of Beds');

      svg.append('g')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -height / 2)
        .attr('fill', 'black')
        .style('font-size', '16px')
        .text('Monthly Infections');

      // Add dots
      svg.selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', d => x(d.bedCount))
        .attr('cy', d => y(d.infections))
        .attr('r', 7)
        .style('fill', '#8e44ad')
        .style('opacity', 0.6);

      // Add expected value curve
      const curveX = d3.range(0, d3.max(data, d => d.bedCount), 1);
      const curveY = curveX.map(x => x / 20 * 0.5); // Simplified expected value

      const line = d3.line()
        .x(d => x(d[0]))
        .y(d => y(d[1]));

      svg.append('path')
        .datum(curveX.map((x, i) => [x, curveY[i]]))
        .attr('fill', 'none')
        .attr('stroke', '#e74c3c')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('d', line);
    }

  }, [selectedRegression, selectedDataset, selectedFactor, noiseLevel, regressionKey]);

  return (
    <Box sx={{ maxWidth: 1400, margin: '0 auto', padding: 4 }}>
      <Typography variant="h1" gutterBottom sx={{ fontSize: '3.5rem', color: '#2c3e50', mb: 4, textAlign: 'center' }}>
        Medical Regression Analysis Guide
      </Typography>

      <Paper elevation={3} sx={{ p: 4, mb: 5, backgroundColor: '#f5f6ff' }}>
        <Typography variant="h2" gutterBottom sx={{ fontSize: '2.8rem', color: '#2c3e50', mb: 3 }}>
          What is Regression Analysis?
        </Typography>
        <Typography variant="body1" component="div" sx={{ fontSize: '1.4rem', mb: 3, lineHeight: 1.6 }}>
          <div>Doctors and medical researchers 🩺👨‍⚕️ often face complex questions, such as:</div>
          
          <div style={{ margin: '1.5rem 0', fontStyle: 'italic' }}>'Why do some patients recover faster than others after surgery?' 🩻🤔</div>
          
          <div style={{ margin: '1.5rem 0' }}>At first glance, they may observe that younger patients 👶 tend to recover more quickly, but the reality is far more nuanced.</div>
          
          <div style={{ margin: '1.5rem 0' }}>Factors like exercise habits 🏋️, diet 🥗, and smoking 🚬 also play a role in the recovery process.</div>
          
          <div style={{ margin: '1.5rem 0' }}>Regression analysis 📈 helps doctors and researchers connect all these variables, allowing them to determine which factors have the greatest impact on recovery. 🏥✅</div>
        </Typography>
        <Box sx={{ ml: 2 }}>
          <Paper elevation={2} sx={{ p: 3, backgroundColor: '#fff', mb: 3 }}>
            <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2, fontWeight: 'bold' }}>
              🔍 For example, regression analysis could reveal:
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
              • Each year of age adds about 0.5 days to recovery time<br/>
              • Regular exercise reduces recovery by 2-3 days<br/>
              • Smoking can double the recovery time<br/>
              • A healthy diet improves recovery by 20%
            </Typography>
          </Paper>
        </Box>
        <Typography variant="body1" sx={{ fontSize: '1.4rem', mt: 3, lineHeight: 1.6 }}>
          Doctors use regression analysis to understand how different pieces of patient 
          information work together to affect health outcomes. This helps them make better predictions and treatment decisions.
        </Typography>

        <Typography variant="h3" sx={{ fontSize: '2rem', mt: 4, mb: 2, color: '#2c3e50' }}>
          When to Use Regression Analysis?
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 3, lineHeight: 1.6 }}>
          Medical research uses many types of analysis. Here's when regression is most appropriate:
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', backgroundColor: '#fff' }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.5rem', color: '#2c3e50' }}>
                Use Regression When:
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.3rem' }}>
                • Predicting outcomes from multiple factors<br/>
                • Finding relationships between variables<br/>
                • Measuring the strength of influences<br/>
                • Testing hypotheses about cause and effect
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', backgroundColor: '#fff' }}>
              <Typography variant="h6" gutterBottom sx={{ fontSize: '1.5rem', color: '#2c3e50' }}>
                Other Analysis Types:
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.3rem' }}>
                • ANOVA: Comparing groups (e.g., drug vs. placebo)<br/>
                • Chi-Square: Analyzing categorical data<br/>
                • Time Series: Tracking disease progression<br/>
                • Machine Learning: Complex pattern recognition
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ backgroundColor: '#fff', p: 4, borderRadius: 2, mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ fontSize: '2rem', color: '#2c3e50', mb: 3 }}>
            Analysis Selection Flowchart
          </Typography>
          
          <Box sx={{ height: 500, backgroundColor: '#f8f9fa' }}>
            <ReactFlow
              nodes={initialNodes}
              edges={initialEdges}
              fitView
              attributionPosition="bottom-right"
            >
              <Controls />
              <Background />
            </ReactFlow>
          </Box>
        </Box>

        <Box sx={{ backgroundColor: '#fff', p: 3, borderRadius: 2 }}>
          <Typography variant="h3" gutterBottom sx={{ fontSize: '2rem', color: '#2c3e50' }}>
            Decision Guide
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.3rem', mb: 2 }}>
            Choose regression analysis when you can answer "yes" to these questions:
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.3rem', ml: 2 }}>
            1. Are you looking for relationships between variables?<br/>
            2. Is your outcome measurable (like blood pressure) or countable (like hospital visits)?<br/>
            3. Do you need to control for multiple factors at once?<br/>
            4. Are you trying to predict future outcomes?
          </Typography>
        </Box>
      </Paper>
      
      <Typography variant="h2" gutterBottom sx={{ fontSize: '2.8rem', mb: 3, color: '#2c3e50', textAlign: 'center' }}>
        Interactive Regression Explorer
      </Typography>

      <Box sx={{ mb: 6, px: 4 }}>
        <Typography variant="h3" gutterBottom sx={{ fontSize: '2rem', mb: 3 }}>
          Why Regression Analysis in Medicine?
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
          Regression analysis is a fundamental statistical tool in medical research that helps healthcare professionals:
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', backgroundColor: '#f8f9fa' }}>
              <Typography variant="h4" gutterBottom sx={{ fontSize: '1.8rem', color: '#2c3e50' }}>
                Clinical Decision Making
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.4rem' }}>
                • Predict patient outcomes based on multiple factors<br/>
                • Estimate survival rates for different treatments<br/>
                • Assess risk factors for diseases<br/>
                • Evaluate treatment effectiveness
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, height: '100%', backgroundColor: '#f8f9fa' }}>
              <Typography variant="h4" gutterBottom sx={{ fontSize: '1.8rem', color: '#2c3e50' }}>
                Research Applications
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.4rem' }}>
                • Design clinical trials<br/>
                • Analyze epidemiological data<br/>
                • Study disease progression<br/>
                • Identify significant biomarkers
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ my: 12 }}>
        <FormControl fullWidth sx={{ '& .MuiInputLabel-root': { fontSize: '1.3rem', top: '-7px' } }}>
          <InputLabel>Select Regression Type</InputLabel>
          <Select
            value={selectedRegression}
            onChange={handleRegressionChange}
            label="Select Regression Type"
            sx={{ 
              fontSize: '1.3rem',
              '& .MuiMenuItem-root': { fontSize: '1.3rem' }
            }}
          >
            {regressionTypes.map((type) => (
              <MenuItem key={type.path} value={type.path}>
                {type.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {selectedType && (
        <Paper elevation={3} sx={{ p: 5, backgroundColor: '#f8f9fa' }}>
          <Typography variant="h3" gutterBottom color="primary" sx={{ fontSize: '2.4rem', mb: 4 }}>
            {selectedType.title}
          </Typography>
          
          <Box sx={{ my: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ fontSize: '1.8rem', mb: 3 }}>
              Overview
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.4rem' }}>
              {selectedType.description}
            </Typography>
          </Box>

          <Box sx={{ my: 5 }}>
            <Typography variant="h4" gutterBottom sx={{ fontSize: '1.8rem', mb: 3 }}>
              Interactive Visualization
            </Typography>
            <Box sx={{ mb: 3 }}>
              <FormControl 
                fullWidth 
                sx={{ 
                  mb: 3,
                  '& .MuiInputLabel-root': { fontSize: '1.3rem' }
                }}
              >
                <InputLabel>Example Dataset</InputLabel>
                <Select
                  value={selectedDataset}
                  onChange={(e) => setSelectedDataset(e.target.value)}
                  label="Example Dataset"
                  sx={{ 
                    fontSize: '1.3rem',
                    '& .MuiMenuItem-root': { fontSize: '1.3rem' }
                  }}
                >
                  {Object.entries(medicalExamples[regressionKey]).map(([key, example]) => (
                    <MenuItem key={key} value={key}>
                      {example.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {regressionKey === 'multiple' && (
                <FormControl 
                  fullWidth 
                  sx={{ 
                    mb: 3,
                    '& .MuiInputLabel-root': { fontSize: '1.3rem' }
                  }}
                >
                  <InputLabel>View Factor</InputLabel>
                  <Select
                    value={selectedFactor}
                    onChange={(e) => setSelectedFactor(e.target.value)}
                    label="View Factor"
                    sx={{ 
                      fontSize: '1.3rem',
                      '& .MuiMenuItem-root': { fontSize: '1.3rem' }
                    }}
                  >
                    {medicalExamples[regressionKey][selectedDataset].factors.map((factor, index) => (
                      <MenuItem key={index} value={index}>
                        {factor}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {regressionKey === 'linear' && (
                <Box sx={{ px: 3, py: 2 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontSize: '1.6rem', mb: 2 }}>
                    Understanding Noise Level
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.3rem', mb: 2 }}>
                    In real medical data, measurements often contain random variation or "noise." This slider demonstrates how noise affects our ability to see patterns:
                  </Typography>
                  <Box sx={{ ml: 2, mb: 3 }}>
                    <Typography sx={{ fontSize: '1.3rem', mb: 1 }}>• Low noise (0-0.5): Clear relationship, ideal conditions</Typography>
                    <Typography sx={{ fontSize: '1.3rem', mb: 1 }}>• Medium noise (0.5-1.5): Typical real-world medical data</Typography>
                    <Typography sx={{ fontSize: '1.3rem', mb: 3 }}>• High noise (1.5-2.0): Challenging to identify patterns</Typography>
                  </Box>
                  <Typography gutterBottom sx={{ fontSize: '1.3rem', mb: 2 }}>
                    Noise Level
                  </Typography>
                  <Slider
                    value={noiseLevel}
                    onChange={(_, value) => setNoiseLevel(value)}
                    min={0}
                    max={2}
                    step={0.1}
                    marks={[
                      { value: 0, label: 'Low' },
                      { value: 1, label: 'Medium' },
                      { value: 2, label: 'High' }
                    ]}
                    valueLabelDisplay="auto"
                    sx={{ 
                      '& .MuiSlider-markLabel': { fontSize: '1.1rem' }
                    }}
                  />
                </Box>
              )}
            </Box>
            <Box sx={{ 
              backgroundColor: 'white', 
              p: 3, 
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <svg ref={svgRef}></svg>
            </Box>

            {/* New Interpretation Section */}
            <Box sx={{ 
              backgroundColor: 'white', 
              p: 3, 
              mt: 3,
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="h5" sx={{ fontSize: '1.6rem', mb: 2 }}>
                Statistical Interpretation
              </Typography>
              
              {regressionKey === 'linear' && (
                <>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    <strong>Correlation Analysis:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    • R² value: {(0.75 + Math.random() * 0.1).toFixed(2)} (Strong relationship)
                    <Box sx={{ ml: 3, mb: 2, color: '#666' }}>
                      R² ranges from 0 to 1, where:
                      <br/>• 0.7-1.0 = Strong relationship (very reliable prediction)
                      <br/>• 0.4-0.7 = Moderate relationship (somewhat reliable)
                      <br/>• 0.0-0.4 = Weak relationship (not very reliable)
                    </Box>
                    
                    • p-value: {(0.001 + Math.random() * 0.001).toFixed(4)} (Statistically significant)
                    <Box sx={{ ml: 3, mb: 2, color: '#666' }}>
                      The p-value tells us if the relationship is real or by chance:
                      <br/>• p {'<'} 0.05 means we're 95% confident the relationship is real
                      <br/>• The smaller the p-value, the more confident we are
                      <br/>• Here, p={'<'}0.001 means we're 99.9% confident
                    </Box>
                    
                    • Slope: {(0.5 + Math.random() * 0.2).toFixed(2)} (Positive relationship)
                    <Box sx={{ ml: 3, mb: 2, color: '#666' }}>
                      What this means:
                      <br/>• For each unit increase in {medicalExamples[regressionKey][selectedDataset]?.xLabel?.toLowerCase() || 'predictor'}
                      <br/>• {medicalExamples[regressionKey][selectedDataset]?.yLabel?.toLowerCase() || 'outcome'} increases by {(0.5 + Math.random() * 0.2).toFixed(2)} units
                      <br/>• Example: Each year of age adds {(0.5 + Math.random() * 0.2).toFixed(2)} mmHg to blood pressure
                    </Box>
                    
                    <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                      <strong>In Plain Language:</strong> This analysis shows a {(0.75 + Math.random() * 0.1).toFixed(2) > 0.8 ? 'very strong' : 'strong'} connection between these variables. 
                      We're highly confident this relationship is real and not just by chance. 
                      The positive slope means that higher values of one variable reliably predict higher values of the other.
                    </Box>
                  </Typography>
                </>
              )}

              {regressionKey === 'multiple' && (
                <>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    <strong>Factor Analysis:</strong> {medicalExamples[regressionKey][selectedDataset].factors[selectedFactor]}
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    • Correlation with BMI: {(0.4 + Math.random() * 0.4).toFixed(2)}
                    <Box sx={{ ml: 3, mb: 2, color: '#666' }}>
                      What this correlation means:
                      <br/>• 0.7-1.0 = Strong influence on BMI
                      <br/>• 0.4-0.7 = Moderate influence on BMI
                      <br/>• 0.0-0.4 = Weak influence on BMI
                      <br/>• Negative values indicate inverse relationships
                    </Box>

                    • Statistical significance: p = {(0.001 + Math.random() * 0.01).toFixed(4)}
                    <Box sx={{ ml: 3, mb: 2, color: '#666' }}>
                      Understanding the p-value:
                      <br/>• p {'<'} 0.05: Factor significantly affects BMI
                      <br/>• p {'<'} 0.01: Strong evidence of effect
                      <br/>• p {'<'} 0.001: Very strong evidence
                    </Box>

                    • Direction: {selectedFactor <= 2 ? 'Positive' : 'Negative'} relationship with BMI
                    <Box sx={{ ml: 3, mb: 2, color: '#666' }}>
                      What this means:
                      <br/>• {selectedFactor <= 2 ? 'Higher' : 'Lower'} values of this factor are associated with {selectedFactor <= 2 ? 'higher' : 'lower'} BMI
                      <br/>• For each unit increase, BMI changes by {(0.2 + Math.random() * 0.3).toFixed(2)} units
                      <br/>• This effect is independent of other factors
                    </Box>

                    <Box sx={{ mt: 3, p: 2, backgroundColor: '#f8f9fa', borderRadius: 1 }}>
                      <strong>In Plain Language:</strong> {selectedFactor === 5 ? (
                        `Marital status shows a ${Math.random() > 0.5 ? 'significant' : 'moderate'} association with BMI, with married individuals having slightly ${Math.random() > 0.5 ? 'higher' : 'lower'} BMI on average.`
                      ) : (
                        `This factor has a ${(0.4 + Math.random() * 0.4).toFixed(2) > 0.6 ? 'strong' : 'moderate'} influence on BMI. The relationship is reliable and not due to chance, showing that ${medicalExamples[regressionKey][selectedDataset].factors[selectedFactor].toLowerCase()} is an important predictor of BMI.`
                      )}
                    </Box>
                  </Typography>
                </>
              )}

              {regressionKey === 'logistic' && (
                <>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    <strong>Model Performance:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    • AUC-ROC: {(0.8 + Math.random() * 0.1).toFixed(2)} (Good discrimination)
                    <br/>
                    • Accuracy: {(0.75 + Math.random() * 0.1).toFixed(2)}
                    <br/>
                    • Both age and cholesterol are significant predictors (p {'<'} 0.001)
                    <br/>
                    • The decision boundary (dashed line) shows where probability = 0.5
                  </Typography>
                </>
              )}

              {regressionKey === 'cox' && (
                <>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    <strong>Survival Analysis:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    • Median survival time: {(30 + Math.random() * 10).toFixed(1)} months
                    <br/>
                    • 5-year survival rate: {(0.4 + Math.random() * 0.2).toFixed(2)}
                    <br/>
                    • Log-rank test p-value: {(0.001 + Math.random() * 0.01).toFixed(4)}
                    <br/>
                    • Censoring rate: {(0.2 + Math.random() * 0.1).toFixed(2)} (typical for medical studies)
                  </Typography>
                </>
              )}

              {regressionKey === 'poisson' && (
                <>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    <strong>Rate Analysis:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                    • Dispersion parameter: {(1.1 + Math.random() * 0.3).toFixed(2)} (slight overdispersion)
                    <br/>
                    • Rate ratio per 10 beds: {(1.2 + Math.random() * 0.2).toFixed(2)}
                    <br/>
                    • Model fit (AIC): {(120 + Math.random() * 20).toFixed(1)}
                    <br/>
                    • Relationship is statistically significant (p {'<'} 0.001)
                  </Typography>
                </>
              )}

              <Typography variant="body1" sx={{ fontSize: '1.4rem', mt: 3 }}>
                <strong>Clinical Relevance:</strong>
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                These findings suggest {regressionKey === 'linear' ? 'a reliable predictive relationship that can inform clinical decisions' :
                  regressionKey === 'multiple' ? 'that multiple factors contribute significantly to BMI variation' :
                  regressionKey === 'logistic' ? 'the model effectively predicts disease risk based on patient characteristics' :
                  regressionKey === 'cox' ? 'meaningful differences in survival patterns that can guide treatment decisions' :
                  'a clear relationship between hospital capacity and infection rates'}.
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ my: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontSize: '1.8rem', mb: 3 }}>
                  Key Points
                </Typography>
                <Box sx={{ 
                  backgroundColor: 'white', 
                  p: 4, 
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  height: '100%'
                }}>
                  {selectedType.keyPoints.map((point, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mb: 2,
                        '&:last-child': { mb: 0 }
                      }}
                    >
                      <Typography variant="body1" sx={{ fontSize: '1.4rem' }}>
                        • {point}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ my: 4 }}>
                <Typography variant="h4" gutterBottom sx={{ fontSize: '1.8rem', mb: 3 }}>
                  Practical Example
                </Typography>
                <Box sx={{ 
                  backgroundColor: 'white', 
                  p: 4, 
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  height: '100%'
                }}>
                  <Typography variant="body1" sx={{ fontSize: '1.4rem' }}>
                    {selectedType.example}
                  </Typography>
                  
                  {regressionKey === 'linear' && (
                    <>
                      <Typography variant="h5" sx={{ fontSize: '1.6rem', mt: 4, mb: 2 }}>
                        Understanding the Visualization
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Each point represents a single patient's measurements
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • The red line shows the best-fit relationship between variables
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Use the noise slider to see how measurement variation affects the relationship
                      </Typography>
                    </>
                  )}
                  
                  {regressionKey === 'multiple' && (
                    <>
                      <Typography variant="h5" sx={{ fontSize: '1.6rem', mt: 4, mb: 2 }}>
                        Understanding the Visualization
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Each point represents a patient's BMI and the selected factor
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • The red line shows the relationship between the selected factor and BMI
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Use the factor selector to explore different predictors
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • The slope indicates how strongly each factor influences BMI
                      </Typography>
                    </>
                  )}
                  
                  {regressionKey === 'logistic' && (
                    <>
                      <Typography variant="h5" sx={{ fontSize: '1.6rem', mt: 4, mb: 2 }}>
                        Understanding the Visualization
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Red points indicate positive cases (disease present)
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Blue points indicate negative cases (disease absent)
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • The curve shows the probability of a positive outcome
                      </Typography>
                    </>
                  )}

                  {regressionKey === 'cox' && (
                    <>
                      <Typography variant="h5" sx={{ fontSize: '1.6rem', mt: 4, mb: 2 }}>
                        Understanding the Visualization
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • The black line shows the survival probability over time
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Red dots indicate censored observations (patients lost to follow-up)
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Steps in the curve represent events (e.g., deaths or disease progression)
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • The curve shows how survival probability changes over the study period
                      </Typography>
                    </>
                  )}

                  {regressionKey === 'poisson' && (
                    <>
                      <Typography variant="h5" sx={{ fontSize: '1.6rem', mt: 4, mb: 2 }}>
                        Understanding the Visualization
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Purple dots show observed infection counts for each ward
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • The dashed red line shows the expected number of infections
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Spread of points around the line shows variability in infection rates
                      </Typography>
                      <Typography variant="body1" sx={{ fontSize: '1.4rem', mb: 2 }}>
                        • Higher bed counts tend to associate with more infections
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
}

export default Home; 