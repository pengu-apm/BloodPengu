import React from 'bloodpengu';
import { ICluster } from 'bloodpengu';

export const CurrentCluster = React.createContext<ICluster | null>(null);
CurrentCluster.displayName = 'CurrentCluster';
