import React, { useEffect, useRef, useState } from 'react';
import { Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import * as d3 from 'd3';

const medicalExamples = {
  heartDisease: {
    name: 'Heart Disease Risk',
    data: Array.from({ length: 100 }, () => {
      const age = 30 + Math.random() * 50;
      const cholesterol = 150 + Math.random() * 150;
      // Probability increases with age and cholesterol
      const probability = 1 / (1 + Math.exp(-(age/20 + cholesterol/100 - 15)));
      const outcome = Math.random() < probability ? 1 : 0;
      return { age, cholesterol, outcome };
    }),
    xLabel: 'Age (years)',
    yLabel: 'Cholesterol (mg/dL)'
  },
  diabetesRisk: {
    name: 'Diabetes Risk',
    data: Array.from({ length: 100 }, () => {
      const bmi = 18 + Math.random() * 22;
      const glucoseLevel = 70 + Math.random() * 130;
      // Probability increases with BMI and glucose
      const probability = 1 / (1 + Math.exp(-(bmi/10 + glucoseLevel/50 - 8)));
      const outcome = Math.random() < probability ? 1 : 0;
      return { bmi, glucoseLevel, outcome };
    }),
    xLabel: 'BMI',
    yLabel: 'Fasting Glucose (mg/dL)'
  }
};

function LogisticRegression() {
  const svgRef = useRef();
  const [selectedExample, setSelectedExample] = useState('heartDisease');
  
  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = medicalExamples[selectedExample].data;
    
    // Get x and y values based on selected example
    const xValues = selectedExample === 'heartDisease' 
      ? data.map(d => d.age)
      : data.map(d => d.bmi);
    
    const yValues = selectedExample === 'heartDisease'
      ? data.map(d => d.cholesterol)
      : data.map(d => d.glucoseLevel);

    const outcomes = data.map(d => d.outcome);

    // Scales
    const x = d3.scaleLinear()
      .domain([d3.min(xValues) * 0.9, d3.max(xValues) * 1.1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.min(yValues) * 0.9, d3.max(yValues) * 1.1])
      .range([height, 0]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('fill', 'black')
      .text(medicalExamples[selectedExample].xLabel);

    svg.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .text(medicalExamples[selectedExample].yLabel);

    // Add dots with different colors based on outcome
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (_, i) => x(xValues[i]))
      .attr('cy', (_, i) => y(yValues[i]))
      .attr('r', 5)
      .style('fill', (_, i) => outcomes[i] === 1 ? '#ff6b6b' : '#4ecdc4')
      .style('opacity', 0.7);

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 100}, 20)`);

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 5)
      .style('fill', '#4ecdc4');

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 20)
      .attr('r', 5)
      .style('fill', '#ff6b6b');

    legend.append('text')
      .attr('x', 10)
      .attr('y', 4)
      .text('Negative');

    legend.append('text')
      .attr('x', 10)
      .attr('y', 24)
      .text('Positive');

  }, [selectedExample]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Logistic Regression in Medical Research
      </Typography>
      
      <Typography variant="body1" paragraph>
        Logistic regression predicts binary outcomes (yes/no, present/absent) based on one or more predictor variables.
        It's commonly used in medical diagnosis and risk assessment.
      </Typography>

      <Card className="interactive-controls">
        <CardContent>
          <FormControl fullWidth>
            <InputLabel>Example Dataset</InputLabel>
            <Select
              value={selectedExample}
              onChange={(e) => setSelectedExample(e.target.value)}
              label="Example Dataset"
            >
              {Object.entries(medicalExamples).map(([key, example]) => (
                <MenuItem key={key} value={key}>{example.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <div className="visualization-container">
        <svg ref={svgRef}></svg>
      </div>

      <Typography variant="h6" gutterBottom>
        Key Concepts
      </Typography>
      
      <Typography variant="body1" paragraph>
        • Logistic regression predicts probability of a binary outcome
      </Typography>
      <Typography variant="body1" paragraph>
        • The outcome is transformed using the logistic function
      </Typography>
      <Typography variant="body1" paragraph>
        • Red dots represent positive cases (disease present)
      </Typography>
      <Typography variant="body1" paragraph>
        • Teal dots represent negative cases (disease absent)
      </Typography>
      <Typography variant="body1" paragraph>
        • The decision boundary separates the two classes
      </Typography>
    </div>
  );
}

export default LogisticRegression; 