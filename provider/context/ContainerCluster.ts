import React from 'react';
import { ICluster } from 'bloodpengu';

export const ContainerCluster = React.createContext<ICluster | null>(null);
ContainerCluster.displayName = 'ContainerCluster';
