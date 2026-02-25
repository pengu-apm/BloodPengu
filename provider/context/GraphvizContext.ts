import React from 'react';
import { ICluster } from 'bloodpengu';

export interface IContext {
  container?: ICluster;
}

export const GraphvizContext = React.createContext<IContext>(null!);
GraphvizContext.displayName = 'GraphvizContext';
