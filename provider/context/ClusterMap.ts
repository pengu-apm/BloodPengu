import React from 'react';
import { ICluster } from 'ts-bloodpengu';

export const ClusterMap = React.createContext<Map<string, ICluster>>(new Map());
ClusterMap.displayName = 'ClusterMap';
