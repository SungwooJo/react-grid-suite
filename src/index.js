
"use strict";
require('../css/styles.css');

import React from 'react';
import ReactDOM from 'react-dom';
import TemplateTest from './TemplateTest';

typeof window !== "undefined" && (window.React = React); // for devtools


ReactDOM.render(<TemplateTest />, document.getElementById('root'));