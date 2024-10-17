import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function CIIProjection({ ciiResults }) {
  // Generate projection data
  const projectionData = [/* ... */];

  return (
    <LineChart width={600} height={300} data={projectionData}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="year" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="projectedCII" stroke="#8884d8" />
    </LineChart>
  );
}

export default CIIProjection;
