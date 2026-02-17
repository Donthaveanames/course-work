export default function checkLogin() {
    return !!localStorage.getItem('access_token');
}
