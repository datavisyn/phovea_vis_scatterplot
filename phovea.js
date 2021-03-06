/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function (registry) {
  //registry.push('extension-type', 'extension-id', function() { return System.import('./src/extension_impl'); }, {});
  // generator-phovea:begin

  registry.push('vis', 'canvas-scatterplot', function () {
    return System.import('./src/index');
  }, {
    name: 'ScatterPlot',
    filter: [ //just matrixes with real or int = number
      'matrix',
      '(real|int)'
    ],
    icon: function () {
      return System.import('./src/assets/icon.svg');
    },
  });
  // generator-phovea:end
};

