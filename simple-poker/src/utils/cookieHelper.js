import Cookies from 'js-cookie'

export const getCookieHelper = name => {
	const cookieValue = Cookies.get(name)
	if (cookieValue) {
		return cookieValue
	} else {
		if (name === 'sound') {
			return true
		} else {
			return false
		}
	}
}

export const setCookieHelper = (name, value) => {
	Cookies.set(name, value)
}
