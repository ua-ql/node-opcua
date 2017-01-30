# OPC.UA Part 4 7.21 Numerical Range

The syntax for the string contains one of the following two constructs. The first construct is the string
representation of an individual integer. For example, '6' is   valid, but '6.0' and '3.2' are not. The
minimum and maximum values that can be expressed are defined by the use of this parameter and
not by this parameter type definition. The second construct is a range represented by two integers
separated by the colon   (':') character. The first integer shall always have a lower value than the
second. For example, '5:7' is valid, while '7:5' and '5:5' are not. The minimum and maximum values
that can be expressed by these integers are defined by the use of this parameter , and not by this
parameter type definition. No other characters, including white - space characters, are permitted.
Multi- dimensional arrays can be indexed by specifying a range for each dimension separated by a ','.

For example, a 2x2 block in a 4x4 matrix   could be selected with the range '1:2,0:1'. A single element
in a multi - dimensional array can be selected by specifying a single number instead of a range.

For example, '1,1' specifies selects the [1,1] element in a two dimensional array.
Dimensions are specified in the order that they appear in the  ArrayDimensions Attribute.
All dimensions shall be specified for a  NumericRange  to be valid.

All indexes start with 0. The maximum value for any index is one less than the length of the
dimension.