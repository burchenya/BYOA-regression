import React, { useEffect, useRef, useState } from 'react';
import { Typography, Card, CardContent, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import * as d3 from 'd3';

const medicalExamples = {
  hospitalInfections: {
    name: 'Hospital-Acquired Infections',
    data: Array.from({ length: 50 }, () => {
      const bedCount = Math.floor(10 + Math.random() * 90);
      const staffRatio = 0.2 + Math.random() * 0.5;
      // Infection count increases with bed count and decreases with staff ratio
      const lambda = (bedCount / 20) * (1 - staffRatio);
      const infections = poissonSample(lambda);
      return { bedCount, staffRatio, infections };
    }),
    xLabel: 'Number of Beds',
    yLabel: 'Monthly Infections'
  },
  adverseEvents: {
    name: 'Medication Adverse Events',
    data: Array.from({ length: 50 }, () => {
      const patientCount = Math.floor(50 + Math.random() * 150);
      const medicationCount = Math.floor(2 + Math.random() * 8);
      // Events increase with patient count and medication count
      const lambda = (patientCount / 50) * (medicationCount / 2);
      const events = poissonSample(lambda);
      return { patientCount, medicationCount, events };
    }),
    xLabel: 'Number of Patients',
    yLabel: 'Weekly Adverse Events'
  }
};

// Helper function to generate Poisson-distributed random numbers
function poissonSample(lambda) {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  
  return k - 1;
}

function PoissonRegression() {
  const svgRef = useRef();
  const [selectedExample, setSelectedExample] = useState('hospitalInfections');
  
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
    const xValues = selectedExample === 'hospitalInfections'
      ? data.map(d => d.bedCount)
      : data.map(d => d.patientCount);
    
    const yValues = selectedExample === 'hospitalInfections'
      ? data.map(d => d.infections)
      : data.map(d => d.events);

    // Scales
    const x = d3.scaleLinear()
      .domain([0, d3.max(xValues) * 1.1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(yValues) * 1.1])
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

    // Add dots
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (_, i) => x(xValues[i]))
      .attr('cy', (_, i) => y(yValues[i]))
      .attr('r', 5)
      .style('fill', '#8e44ad')
      .style('opacity', 0.6);

    // Add expected value curve
    const curveX = d3.range(0, d3.max(xValues), d3.max(xValues) / 100);
    const curveY = curveX.map(x => {
      if (selectedExample === 'hospitalInfections') {
        return x / 20 * 0.5; // Simplified expected value
      } else {
        return x / 50 * 2; // Simplified expected value
      }
    });

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

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 20)`);

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 5)
      .style('fill', '#8e44ad');

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 20)
      .attr('y2', 20)
      .style('stroke', '#e74c3c')
      .style('stroke-width', 2)
      .style('stroke-dasharray', '5,5');

    legend.append('text')
      .attr('x', 30)
      .attr('y', 4)
      .text('Observed');

    legend.append('text')
      .attr('x', 30)
      .attr('y', 24)
      .text('Expected');

  }, [selectedExample]);

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Poisson Regression in Medical Research
      </Typography>
      
      <Typography variant="body1" paragraph>
        Poisson regression models count data and rare events.
        It's commonly used in epidemiology and healthcare quality assessment.
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
        • Poisson regression models count data (non-negative integers)
      </Typography>
      <Typography variant="body1" paragraph>
        • The mean equals the variance (equidispersion)
      </Typography>
      <Typography variant="body1" paragraph>
        • Purple dots show observed counts
      </Typography>
      <Typography variant="body1" paragraph>
        • Dashed red line shows expected counts
      </Typography>
      <Typography variant="body1" paragraph>
        • Often used for rare events or rates over time/space
      </Typography>
    </div>
  );
}

export default PoissonRegression; 