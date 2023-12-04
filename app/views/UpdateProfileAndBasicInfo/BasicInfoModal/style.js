import { Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modal_container: {
    position:'absolute', 
    bottom:0, 
    left:0,
    margin:0
  },
  container: {
    width: width,
    backgroundColor: '#fff',
    borderTopEndRadius: 20,
    borderTopStartRadius: 20,
    height: height * 0.85,
    paddingHorizontal:15,
    paddingTop: 15
  },
  title: {
    fontFamily: 'Hind Vadodara',
    fontWeight: '600',
    fontSize: 20,
    marginTop: 26,
    alignSelf: 'center'
  },
  descriptionText: {
    fontFamily: 'Raleway',
    fontWeight: '400',
    fontSize: 12,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20
  },
  submitBtn: {
    marginTop: 15,
    paddingVertical: 2,
    alignSelf: 'center',
    height: 45,
    width: width * 0.92
  },
  selectStyle: {
    height: 80
  },
});

export default styles;