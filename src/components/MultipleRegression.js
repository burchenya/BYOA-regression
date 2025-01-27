import React, { useEffect, useRef, useState } from 'react';
import { Typography, Card, CardContent, Slider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import * as d3 from 'd3';

const medicalExamples = {
  bmiFactors: {
    name: 'BMI Factors',
    data: Array.from({ length: 50 }, () => ({
      height: 150 + Math.random() * 40,
      weight: 50 + Math.random() * 50,
      age: 20 + Math.random() * 60,
      bmi: 0 // will be calculated
    })).map(d => {
      // Calculate BMI: weight(kg) / height(m)²
      const heightInM = d.height / 100;
      d.bmi = d.weight / (heightInM * heightInM);
      return d;
    }),
    factors: ['Height (cm)', 'Weight (kg)', 'Age (years)']
  },
  hospitalStay: {
    name: 'Hospital Stay Duration',
    data: Array.from({ length: 50 }, () => ({
      age: 20 + Math.random() * 60,
      severity: Math.random() * 10,
      comorbidities: Math.floor(Math.random() * 5),
      stayDuration: 0 // will be calculated
    })).map(d => {
      // Calculate stay duration based on factors
      d.stayDuration = 2 + (d.age / 20) + (d.severity * 1.5) + (d.comorbidities * 2) + (Math.random() * 5);
      return d;
    }),
    factors: ['Age (years)', 'Disease Severity (1-10)', 'Number of Comorbidities']
  }
};

function MultipleRegression() {
  const svgRef = useRef();
  const [selectedExample, setSelectedExample] = useState('bmiFactors');
  const [selectedFactor, setSelectedFactor] = useState(0);
  
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
    const factors = medicalExamples[selectedExample].factors;
    
    // Get x and y values based on selected example
    const xValues = selectedExample === 'bmiFactors' 
      ? data.map(d => [d.height, d.weight, d.age][selectedFactor])
      : data.map(d => [d.age, d.severity, d.comorbidities][selectedFactor]);
    
    const yValues = selectedExample === 'bmiFactors'
      ? data.map(d => d.bmi)
      : data.map(d => d.stayDuration);

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
      .text(factors[selectedFactor]);

    svg.append('g')
      .call(d3.axisLeft(y))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('fill', 'black')
      .text(selectedExample === 'bmiFactors' ? 'BMI' : 'Length of Stay (days)');

    // Add dots
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (_, i) => x(xValues[i]))
      .attr('cy', (_, i) => y(yValues[i]))
      .attr('r', 5)
      .style('fill', '#69b3a2');

    // Calculate and add regression line
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
      .attr('stroke-width', 2)
      .attr('d', line);

  }, [selectedExample, selectedFactor]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Multiple Regression in Medical Research
      </Typography>
      
      <Typography variant="body1" paragraph>
        Multiple regression analyzes how several independent variables influence an outcome.
        This is particularly useful in medical research where conditions and outcomes often depend on multiple factors.
      </Typography>

      <Card className="interactive-controls">
        <CardContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
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

          <FormControl fullWidth>
            <InputLabel>View Factor</InputLabel>
            <Select
              value={selectedFactor}
              onChange={(e) => setSelectedFactor(e.target.value)}
              label="View Factor"
            >
              {medicalExamples[selectedExample].factors.map((factor, index) => (
                <MenuItem key={index} value={index}>{factor}</MenuItem>
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
        • Multiple regression considers several factors simultaneously
      </Typography>
      <Typography variant="body1" paragraph>
        • Each factor's individual contribution can be isolated and analyzed
      </Typography>
      <Typography variant="body1" paragraph>
        • The relationship between variables may not be purely linear
      </Typography>
      <Typography variant="body1" paragraph>
        • Interactions between variables can affect the outcome
      </Typography>
    </div>
  );
}

export default MultipleRegression; 