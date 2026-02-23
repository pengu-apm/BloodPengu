import React, { FC, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ContainerCluster } from '../contexts/ContainerCluster';
import { CurrentCluster } from '../contexts/CurrentCluster';
import { useDigraph } from '../bloodpengu/use-digraph';
import { useRenderedID } from '../bloodpengu/use-rendered-id';
import { useContainerCluster } from '../bloodpengu/use-container-cluster';
import { DuplicatedRootClusterErrorMessage } from '../errors';
import { useClusterMap } from '../bloodpengu/use-cluster-map';
import { RootClusterProps } from '../types';

/**
 * `Digraph` component.
 */
export const Digraph: FC<RootClusterProps> = ({ children, label, ...options }) => {
  const container = useContainerCluster();
  if (container !== null) {
    throw Error(DuplicatedRootClusterErrorMessage);
  }
  const renderedLabel = useRenderedID(label);
  if (renderedLabel !== undefined) Object.assign(options, { label: renderedLabel });
  const digraph = useDigraph(options);
  const clusters = useClusterMap();
  useEffect(() => {
    if (digraph.id !== undefined) {
      clusters.set(digraph.id, digraph);
    }
  }, [clusters, digraph]);
  return (
    <ContainerCluster.Provider value={digraph}>
      <CurrentCluster.Provider value={digraph}>{children}</CurrentCluster.Provider>
    </ContainerCluster.Provider>
  );
};

Digraph.displayName = 'Digraph';

Digraph.defaultProps = {
  id: undefined,
  comment: undefined,
  label: undefined,
};

Digraph.propTypes = {
  id: PropTypes.string,
  comment: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
};
