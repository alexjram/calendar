import { Text, StyleSheet, TextProps } from 'react-native'

interface Props extends TextProps {
	size?: number
}

export default function StyledText({ size, style, children, ...props }: Props) {
	const actualStyle: any = [styles.text]
	if (style) {
		actualStyle.push(style)
	}
	if (size) {
		actualStyle.push({ fontSize: size })
	}
	return (
		<Text style={actualStyle} {...props}>{children}</Text>
	)
}

const styles = StyleSheet.create({
	text: {
		fontFamily: 'HappyMonkey_400Regular'
	}
})
