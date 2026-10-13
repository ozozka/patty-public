/**
 * Local ESLint rules for project-specific architectural conventions.
 * These enforce patterns that cannot be expressed with existing plugins.
 */

/**
 * Enforces that every screen file contains a <ScreenContainer> element.
 */
const screenMustUseScreenContainer = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Screen files must use <ScreenContainer> as the root layout wrapper.',
    },
    messages: {
      missing: 'This screen does not render <ScreenContainer>.',
    },
  },
  create(context) {
    let hasScreenContainer = false;
    return {
      JSXOpeningElement(node) {
        if (
          node.name.type === 'JSXIdentifier' &&
          node.name.name === 'ScreenContainer'
        ) {
          hasScreenContainer = true;
        }
      },
      'Program:exit'(node) {
        if (
          !hasScreenContainer &&
          context.getFilename().includes('src/screens')
        ) {
          context.report({ node, messageId: 'missing' });
        }
      },
    };
  },
};

/**
 * Enforces that <AppHeader> is only used as a value passed to the `header`
 * prop of <ScreenContainer>, never as a standalone JSX child.
 */
const noStandaloneAppHeader = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'AppHeader must be passed via the `header` prop of ScreenContainer.',
    },
    messages: {
      standalone:
        'Do not use <AppHeader> as a standalone JSX child. Pass it via the `header` prop of <ScreenContainer>.',
    },
  },
  create(context) {
    return {
      JSXElement(node) {
        const opening = node.openingElement;
        if (
          opening.name.type !== 'JSXIdentifier' ||
          opening.name.name !== 'AppHeader'
        )
          return;
        if (node.parent.type === 'JSXExpressionContainer') return;
        context.report({ node, messageId: 'standalone' });
      },
    };
  },
};

/**
 * Blocks hardcoded color values in style props and color-related JSX props.
 * Allows colors from useTheme() (e.g., colors.TEXT) since they are theme-aware.
 * Also catches color="#FFFFFF" on icon components and other direct color props.
 */
const noThemeColorsInStyles = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Block hardcoded color values in style props and direct color JSX props. Use theme.colors.* instead.',
    },
    messages: {
      forbidden:
        'Hardcoded color value "{{value}}" in style prop. Use theme.colors.* instead.',
      forbiddenProp:
        'Hardcoded color value "{{value}}" in {{prop}} prop. Use theme.colors.* instead.',
    },
  },
  create(context) {
    const colorPatterns = [
      /^#[0-9a-fA-F]{3,8}$/,
      /^rgb\(/,
      /^rgba\(/,
      /^hsl\(/,
      /^hsla\(/,
      /^(red|blue|green|black|white|yellow|orange|purple|pink|gray|grey|brown|cyan|magenta|transparent)$/i,
    ];

    // Direct JSX props that accept color strings (not style objects)
    const COLOR_PROPS = new Set([
      'color',
      'tintColor',
      'placeholderTextColor',
      'selectionColor',
      'cursorColor',
      'underlayColor',
    ]);

    function isHardcodedColor(value) {
      if (typeof value !== 'string') return false;
      return colorPatterns.some((pattern) => pattern.test(value.trim()));
    }

    function checkForHardcodedColors(node) {
      if (!node) return [];

      const violations = [];

      if (node.type === 'Literal' && typeof node.value === 'string') {
        if (isHardcodedColor(node.value)) {
          violations.push({ node, value: node.value });
        }
      }

      if (node.type === 'ObjectExpression') {
        for (const prop of node.properties) {
          if (prop.type === 'Property' && prop.value) {
            violations.push(...checkForHardcodedColors(prop.value));
          }
        }
      }

      if (node.type === 'ArrayExpression') {
        for (const el of node.elements) {
          if (el) violations.push(...checkForHardcodedColors(el));
        }
      }

      return violations;
    }

    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier') return;

        const propName = node.name.name;

        // Check style prop (object with color keys)
        if (propName === 'style') {
          if (!node.value || node.value.type !== 'JSXExpressionContainer') {
            return;
          }
          const expression = node.value.expression;
          if (expression.type === 'ObjectExpression') {
            const violations = checkForHardcodedColors(expression);
            for (const v of violations) {
              context.report({
                node: v.node,
                messageId: 'forbidden',
                data: { value: v.value },
              });
            }
          }
          return;
        }

        // Check direct color props (e.g. color="#FFF" on icon components)
        if (COLOR_PROPS.has(propName)) {
          if (!node.value) return;

          let colorValue = null;

          if (node.value.type === 'Literal') {
            colorValue = node.value.value;
          } else if (
            node.value.type === 'JSXExpressionContainer' &&
            node.value.expression.type === 'Literal'
          ) {
            colorValue = node.value.expression.value;
          }

          if (colorValue !== null && isHardcodedColor(String(colorValue))) {
            context.report({
              node,
              messageId: 'forbiddenProp',
              data: { value: colorValue, prop: propName },
            });
          }
        }
      },
    };
  },
};

/**
 * Flags Platform.OS checks inside style props that apply includeFontPadding.
 * These should use a centralized utility (e.g., src/utils/platform.ts) instead
 * of being scattered across every component.
 */
const noPlatformInlineStyle = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Platform.OS checks in style props should use a centralized utility.',
    },
    messages: {
      platformInStyle:
        'Platform.OS check in style prop. Use androidTextProps from src/utils/platform instead of inline Platform.OS checks.',
    },
  },
  create(context) {
    function containsPlatformOS(node) {
      if (!node) return false;
      if (
        node.type === 'MemberExpression' &&
        node.object.type === 'Identifier' &&
        node.object.name === 'Platform' &&
        node.property.type === 'Identifier' &&
        node.property.name === 'OS'
      ) {
        return true;
      }
      if (node.type === 'BinaryExpression') {
        return containsPlatformOS(node.left) || containsPlatformOS(node.right);
      }
      if (node.type === 'LogicalExpression') {
        return containsPlatformOS(node.left) || containsPlatformOS(node.right);
      }
      if (node.type === 'ConditionalExpression') {
        return containsPlatformOS(node.test);
      }
      if (node.type === 'SpreadElement') {
        return containsPlatformOS(node.argument);
      }
      return false;
    }

    return {
      // Catch {...(Platform.OS === 'android' && { includeFontPadding: false })} on JSX elements
      JSXSpreadAttribute(node) {
        if (containsPlatformOS(node.argument)) {
          // Check if it involves includeFontPadding or other style-like props
          const arg = node.argument;
          // Pattern: Platform.OS === 'android' && { includeFontPadding: false }
          if (
            arg.type === 'LogicalExpression' &&
            arg.right.type === 'ObjectExpression'
          ) {
            const hasStyleProp = arg.right.properties.some(
              (p) =>
                p.type === 'Property' &&
                p.key.type === 'Identifier' &&
                p.key.name === 'includeFontPadding',
            );
            if (hasStyleProp) {
              context.report({ node, messageId: 'platformInStyle' });
              return;
            }
          }
        }
      },
      // Also catch Platform.OS inside style props
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'style') {
          return;
        }
        if (!node.value || node.value.type !== 'JSXExpressionContainer') {
          return;
        }

        const expression = node.value.expression;
        if (!expression) return;

        const elements =
          expression.type === 'ArrayExpression'
            ? expression.elements
            : expression.type === 'ObjectExpression'
              ? expression.properties
              : [];

        for (const elem of elements) {
          if (!elem) continue;
          if (
            elem.type === 'SpreadElement' &&
            containsPlatformOS(elem.argument)
          ) {
            context.report({ node: elem, messageId: 'platformInStyle' });
          }
          if (elem.type === 'Property' && containsPlatformOS(elem.value)) {
            context.report({ node: elem, messageId: 'platformInStyle' });
          }
        }
      },
    };
  },
};

/**
 * Flags hardcoded numeric duration/delay values in Reanimated animation calls.
 * All animation timing should use Config.animation.duration.* or Config.animation.delay.*
 */
const noHardcodedAnimationValues = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Animation durations and delays must use Config.animation values, not hardcoded numbers.',
    },
    messages: {
      hardcodedDuration:
        'Hardcoded animation duration {{value}}ms. Use Config.animation.duration.* instead.',
      hardcodedDelay:
        'Hardcoded animation delay {{value}}ms. Use Config.animation.delay.* instead.',
    },
  },
  create(context) {
    // withTiming(value, { duration: 300 }) — flag the 300
    // withDelay(300, ...) — flag the 300
    // FadeIn.duration(300) — flag the 300
    const timingFns = new Set(['withTiming', 'withSpring']);

    return {
      CallExpression(node) {
        const callee = node.callee;

        // withTiming(value, { duration: <literal> })
        if (callee.type === 'Identifier' && timingFns.has(callee.name)) {
          const configArg = node.arguments[1];
          if (configArg && configArg.type === 'ObjectExpression') {
            for (const prop of configArg.properties) {
              if (
                prop.type === 'Property' &&
                prop.key.type === 'Identifier' &&
                prop.key.name === 'duration' &&
                prop.value.type === 'Literal' &&
                typeof prop.value.value === 'number'
              ) {
                context.report({
                  node: prop.value,
                  messageId: 'hardcodedDuration',
                  data: { value: String(prop.value.value) },
                });
              }
            }
          }
        }

        // withDelay(300, animation) — first arg is the delay
        if (
          callee.type === 'Identifier' &&
          callee.name === 'withDelay' &&
          node.arguments[0] &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'number'
        ) {
          context.report({
            node: node.arguments[0],
            messageId: 'hardcodedDelay',
            data: { value: String(node.arguments[0].value) },
          });
        }

        // FadeIn.duration(300), ZoomIn.duration(300), etc. — method chain
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'duration' &&
          node.arguments[0] &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'number'
        ) {
          context.report({
            node: node.arguments[0],
            messageId: 'hardcodedDuration',
            data: { value: String(node.arguments[0].value) },
          });
        }

        // FadeIn.delay(300), etc.
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'delay' &&
          node.arguments[0] &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'number'
        ) {
          context.report({
            node: node.arguments[0],
            messageId: 'hardcodedDelay',
            data: { value: String(node.arguments[0].value) },
          });
        }
      },
    };
  },
};

/**
 * Requires testID prop on interactive elements for E2E and component testing.
 */
const requireTestidOnInteractive = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Interactive elements must have a testID prop for testing.',
    },
    messages: {
      missingTestId:
        '<{{name}}> is missing a testID prop. Add testID for E2E and component testing.',
    },
  },
  create(context) {
    const interactiveElements = new Set([
      'TouchableOpacity',
      'Pressable',
      'ActionButton',
      'TextInput',
    ]);

    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier') return;
        if (!interactiveElements.has(node.name.name)) return;

        const hasTestId = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'testID',
        );

        if (!hasTestId) {
          context.report({
            node,
            messageId: 'missingTestId',
            data: { name: node.name.name },
          });
        }
      },
    };
  },
};

/**
 * Flags deeply nested ternary expressions in JSX (more than 1 level deep).
 * AI-generated code frequently produces unreadable chains like:
 *   {a ? <A/> : b ? <B/> : c ? <C/> : <D/>}
 */
const noNestedTernaryJsx = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Nested ternary expressions in JSX are hard to read. Extract to a helper or use early returns.',
    },
    messages: {
      nested:
        'Nested ternary in JSX. Extract to a named function or use if/else with early returns.',
    },
  },
  create(context) {
    function containsJSX(node) {
      if (!node) return false;
      if (node.type === 'JSXElement' || node.type === 'JSXFragment')
        return true;
      if (node.type === 'ConditionalExpression') {
        return containsJSX(node.consequent) || containsJSX(node.alternate);
      }
      return false;
    }

    function isInsideJSXChild(node) {
      let current = node.parent;
      while (current) {
        // Direct child of JSX expression container that is a child (not a prop)
        if (current.type === 'JSXExpressionContainer') {
          const parent = current.parent;
          // If the container's parent is a JSXElement/Fragment, this is a JSX child position
          if (
            parent &&
            (parent.type === 'JSXElement' || parent.type === 'JSXFragment')
          ) {
            return true;
          }
          // If the container is inside a JSXAttribute, it's a prop value — skip
          if (parent && parent.type === 'JSXAttribute') {
            return false;
          }
        }
        if (
          current.type === 'ArrowFunctionExpression' ||
          current.type === 'FunctionExpression' ||
          current.type === 'FunctionDeclaration'
        ) {
          return false;
        }
        current = current.parent;
      }
      return false;
    }

    return {
      ConditionalExpression(node) {
        // Only flag the outermost ternary
        if (node.parent.type === 'ConditionalExpression') return;

        const hasNestedTernary =
          node.consequent.type === 'ConditionalExpression' ||
          node.alternate.type === 'ConditionalExpression';

        if (!hasNestedTernary) return;

        // Only flag when branches produce JSX elements (the truly unreadable case)
        // Skip nested ternaries in className strings, prop values, etc.
        if (containsJSX(node) && isInsideJSXChild(node)) {
          context.report({ node, messageId: 'nested' });
        }
      },
    };
  },
};

/**
 * Flags hardcoded numeric `size` prop on icon components imported from src/lib/icons.
 * Icon sizes must use theme.sizes.iconSm (16), theme.sizes.icon (24), theme.sizes.iconLg (40).
 */
const noHardcodedIconSize = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Icon components must use theme.sizes.* for the size prop, not hardcoded numbers.',
    },
    messages: {
      hardcoded:
        'Hardcoded icon size {{value}}. Use theme.sizes.iconSm (16), theme.sizes.icon (24), or theme.sizes.iconLg (40) from useUnistyles().',
    },
  },
  create(context) {
    const iconNames = new Set();

    return {
      ImportDeclaration(node) {
        if (node.source.value !== 'src/lib/icons') return;
        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportSpecifier') {
            iconNames.add(specifier.local.name);
          }
        }
      },
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier') return;
        if (!iconNames.has(node.name.name)) return;

        for (const attr of node.attributes) {
          if (
            attr.type === 'JSXAttribute' &&
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'size'
          ) {
            const value = attr.value;
            if (!value) return;

            let numericValue = null;
            if (value.type === 'JSXExpressionContainer') {
              if (
                value.expression.type === 'Literal' &&
                typeof value.expression.value === 'number'
              ) {
                numericValue = value.expression.value;
              }
            } else if (
              value.type === 'Literal' &&
              typeof value.value === 'number'
            ) {
              numericValue = value.value;
            }

            if (numericValue !== null) {
              context.report({
                node: attr,
                messageId: 'hardcoded',
                data: { value: numericValue },
              });
            }
          }
        }
      },
    };
  },
};

/**
 * Forbids `opacity` on <Text> components.
 * opacity on Text causes font clipping on Android — use semantic colors instead.
 */
const noOpacityOnText = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'opacity on <Text> causes font clipping on Android. Use semantic colors (theme.colors.*) instead.',
    },
    messages: {
      forbidden:
        'Do not use opacity on <Text>. It causes font clipping on Android. Use a semantic color token (theme.colors.*) with reduced opacity baked in.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'Text')
          return;

        for (const attr of node.attributes) {
          if (attr.type !== 'JSXAttribute') continue;

          // Direct opacity prop: <Text opacity={0.5}>
          if (
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'opacity'
          ) {
            context.report({ node: attr, messageId: 'forbidden' });
            continue;
          }

          // opacity inside style prop: <Text style={{ opacity: 0.5 }}>
          if (
            attr.name.type === 'JSXIdentifier' &&
            attr.name.name === 'style' &&
            attr.value &&
            attr.value.type === 'JSXExpressionContainer'
          ) {
            const expr = attr.value.expression;
            if (expr.type === 'ObjectExpression') {
              for (const prop of expr.properties) {
                if (
                  prop.type === 'Property' &&
                  prop.key.type === 'Identifier' &&
                  prop.key.name === 'opacity' &&
                  prop.value.type === 'Literal'
                ) {
                  context.report({ node: prop, messageId: 'forbidden' });
                }
              }
            }
          }
        }
      },
    };
  },
};

export const patiPlugin = {
  rules: {
    'screen-must-use-screen-container': screenMustUseScreenContainer,
    'no-standalone-app-header': noStandaloneAppHeader,
    'no-theme-colors-in-styles': noThemeColorsInStyles,
    'no-platform-inline-style': noPlatformInlineStyle,
    'no-hardcoded-animation-values': noHardcodedAnimationValues,
    'require-testid-on-interactive': requireTestidOnInteractive,
    'no-nested-ternary-jsx': noNestedTernaryJsx,
    'no-hardcoded-icon-size': noHardcodedIconSize,
    'no-opacity-on-text': noOpacityOnText,
    'no-hardcoded-style-token': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Hardcoded numeric literals in StyleSheet.create must use theme tokens (theme.spacing.*, theme.borderRadius.*, theme.typography.*, theme.getShadow()).',
        },
        messages: {
          spacing:
            'Use theme.spacing.* instead of {{value}}. Tokens: xs=4, sm=8, md=12, lg=16, xl=20, 2xl=24, 3xl=32, 4xl=40.',
          radius:
            'Use theme.borderRadius.* instead of {{value}}. Tokens: xs=4, sm=8, md=12, lg=16, xl=24, 2xl=32, full=9999.',
          font: 'Use ...theme.typography.* spread instead of hardcoded {{prop}}. Never set font values directly.',
          shadow:
            'Use ...theme.getShadow(n) spread instead of hardcoded {{prop}}. Never set shadow properties directly.',
          zIndex:
            'Use theme.zIndex.* instead of {{value}}. Tokens: base=1, dropdown=10, sticky=20, modal=50, toast=60, overlay=100.',
          borderWidth:
            'Use theme.borderWidth[n] instead of {{value}}. Tokens: DEFAULT=1, 1.5, 2, 3, 4.',
          dimension:
            'Use a theme token (theme.sizes.*, theme.heights.*, theme.spacing.*) or extract as a named constant — never a raw number. Got: {{value}}',
          position:
            'Use theme.spacing.* or extract as a named constant for positioning — never a raw number. Got: {{value}}',
        },
      },
      create(context) {
        const styleSheetStack = [];

        const SPACING_PROPS = new Set([
          'padding',
          'paddingHorizontal',
          'paddingVertical',
          'paddingTop',
          'paddingBottom',
          'paddingLeft',
          'paddingRight',
          'margin',
          'marginHorizontal',
          'marginVertical',
          'marginTop',
          'marginBottom',
          'marginLeft',
          'marginRight',
          'gap',
          'rowGap',
          'columnGap',
        ]);

        const DIMENSION_PROPS = new Set([
          'width',
          'height',
          'minWidth',
          'maxWidth',
          'minHeight',
          'maxHeight',
        ]);

        const POSITION_PROPS = new Set(['top', 'bottom', 'left', 'right']);

        const RADIUS_PROPS = new Set([
          'borderRadius',
          'borderTopLeftRadius',
          'borderTopRightRadius',
          'borderBottomLeftRadius',
          'borderBottomRightRadius',
          'borderTopEndRadius',
          'borderTopStartRadius',
          'borderBottomEndRadius',
          'borderBottomStartRadius',
        ]);

        const FONT_PROPS = new Set(['fontSize', 'lineHeight']);

        const SHADOW_PROPS = new Set(['shadowOpacity', 'shadowRadius']);

        const ZINDEX_PROPS = new Set(['zIndex']);

        const BORDER_WIDTH_PROPS = new Set([
          'borderWidth',
          'borderTopWidth',
          'borderBottomWidth',
          'borderLeftWidth',
          'borderRightWidth',
          'borderStartWidth',
          'borderEndWidth',
        ]);

        function isStyleSheetCreate(node) {
          return (
            node.type === 'CallExpression' &&
            node.callee.type === 'MemberExpression' &&
            node.callee.object.type === 'Identifier' &&
            node.callee.object.name === 'StyleSheet' &&
            node.callee.property.type === 'Identifier' &&
            node.callee.property.name === 'create'
          );
        }

        return {
          CallExpression(node) {
            if (isStyleSheetCreate(node)) {
              styleSheetStack.push(node);
            }
          },
          'CallExpression:exit'(node) {
            if (
              styleSheetStack.length > 0 &&
              styleSheetStack[styleSheetStack.length - 1] === node
            ) {
              styleSheetStack.pop();
            }
          },
          Property(node) {
            if (styleSheetStack.length === 0) return;

            if (node.value.type !== 'Literal') return;
            if (typeof node.value.value !== 'number') return;
            if (node.value.value <= 0) return;

            const propName =
              node.key.type === 'Identifier' ? node.key.name : null;
            if (!propName) return;

            if (SPACING_PROPS.has(propName)) {
              context.report({
                node,
                messageId: 'spacing',
                data: { value: node.value.value },
              });
            } else if (RADIUS_PROPS.has(propName)) {
              context.report({
                node,
                messageId: 'radius',
                data: { value: node.value.value },
              });
            } else if (FONT_PROPS.has(propName)) {
              context.report({
                node,
                messageId: 'font',
                data: { prop: propName },
              });
            } else if (SHADOW_PROPS.has(propName)) {
              context.report({
                node,
                messageId: 'shadow',
                data: { prop: propName },
              });
            } else if (ZINDEX_PROPS.has(propName)) {
              context.report({
                node,
                messageId: 'zIndex',
                data: { value: node.value.value },
              });
            } else if (BORDER_WIDTH_PROPS.has(propName)) {
              context.report({
                node,
                messageId: 'borderWidth',
                data: { value: node.value.value },
              });
            } else if (DIMENSION_PROPS.has(propName)) {
              context.report({
                node,
                messageId: 'dimension',
                data: { value: node.value.value },
              });
            } else if (POSITION_PROPS.has(propName)) {
              context.report({
                node,
                messageId: 'position',
                data: { value: node.value.value },
              });
            }
          },
        };
      },
    },
    'no-classname-prop': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'className prop is forbidden. Use style prop with react-native-unistyles.',
        },
        messages: {
          noClassname:
            'className prop is forbidden. Use style prop with react-native-unistyles instead.',
        },
      },
      create(context) {
        return {
          JSXAttribute(node) {
            if (
              node.name.type === 'JSXIdentifier' &&
              node.name.name === 'className'
            ) {
              context.report({ node, messageId: 'noClassname' });
            }
          },
        };
      },
    },
    'no-static-inline-styles': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Detects static inline style values that could be replaced with Tailwind classes or Unistyles.',
        },
        messages: {
          staticStyle:
            'Static inline style detected. Move to StyleSheet.create((theme) => ...) and use theme tokens.',
        },
      },
      create(context) {
        const tailwindableProps = new Set([
          'padding',
          'paddingHorizontal',
          'paddingVertical',
          'paddingTop',
          'paddingBottom',
          'paddingLeft',
          'paddingRight',
          'margin',
          'marginHorizontal',
          'marginVertical',
          'marginTop',
          'marginBottom',
          'marginLeft',
          'marginRight',
          'width',
          'height',
          'minWidth',
          'maxWidth',
          'minHeight',
          'maxHeight',
          'gap',
          'top',
          'bottom',
          'left',
          'right',
          'borderRadius',
          'borderWidth',
          'borderColor',
          'backgroundColor',
          'opacity',
          'fontSize',
          'fontWeight',
          'lineHeight',
          'letterSpacing',
          'zIndex',
        ]);

        const animationProps = new Set([
          'transform',
          'transformMatrix',
          'shadowColor',
          'shadowOffset',
          'shadowOpacity',
          'shadowRadius',
        ]);

        function isStaticNumericLiteral(node) {
          return (
            node && node.type === 'Literal' && typeof node.value === 'number'
          );
        }

        function hasDynamicExpression(value) {
          if (!value) return false;

          if (value.type === 'BinaryExpression') {
            return true;
          }

          if (value.type === 'UnaryExpression') {
            return true;
          }

          if (value.type === 'CallExpression') {
            return true;
          }

          if (value.type === 'MemberExpression') {
            return true;
          }

          if (value.type === 'Identifier') {
            return true;
          }

          if (value.type === 'ConditionalExpression') {
            return true;
          }

          if (value.type === 'LogicalExpression') {
            return true;
          }

          return false;
        }

        function checkObjectExpression(node) {
          const violations = [];

          for (const prop of node.properties) {
            if (prop.type !== 'Property' || prop.computed) continue;

            const key = prop.key;
            let propName = null;

            if (key.type === 'Identifier') {
              propName = key.name;
            } else if (
              key.type === 'Literal' &&
              typeof key.value === 'string'
            ) {
              propName = key.value;
            }

            if (!propName) continue;

            if (animationProps.has(propName)) {
              continue;
            }

            const value = prop.value;

            if (hasDynamicExpression(value)) {
              continue;
            }

            if (isStaticNumericLiteral(value)) {
              if (tailwindableProps.has(propName)) {
                violations.push(prop);
              }
            }
          }

          return violations;
        }

        return {
          JSXAttribute(node) {
            if (
              node.name.type !== 'JSXIdentifier' ||
              node.name.name !== 'style'
            ) {
              return;
            }

            if (!node.value || node.value.type !== 'JSXExpressionContainer') {
              return;
            }

            const expression = node.value.expression;

            if (!expression) return;

            if (expression.type === 'ArrayExpression') {
              const violations = [];
              for (const elem of expression.elements) {
                if (elem && elem.type === 'ObjectExpression') {
                  violations.push(...checkObjectExpression(elem));
                }
              }
              for (const v of violations) {
                context.report({ node: v, messageId: 'staticStyle' });
              }
            } else if (expression.type === 'ObjectExpression') {
              const violations = checkObjectExpression(expression);
              for (const v of violations) {
                context.report({ node: v, messageId: 'staticStyle' });
              }
            }
          },
        };
      },
    },
  },
};
