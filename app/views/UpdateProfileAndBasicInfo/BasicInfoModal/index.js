import React, {useState, useRef} from 'react';
import {View, Text, Dimensions, ScrollView} from 'react-native';
import Modal from 'react-native-modal';
import ExGender from '../../../containers/ExGender';
import CsAutocompleteSelect from '../../../containers/CsAutocompleteSelect';
import FloatingTextInput from '../../../containers/FloatingTextInput';
import I18n from '../../../i18n';

import styles from './style';
import Button from '../../../containers/Button';
import ExDatePicker from '../../../containers/ExDatePicker';
import KeyboardView from '../../../containers/KeyboardView';
import {showErrorAlert, showToast} from '../../../lib/info';
import { Countries } from '../../../constants/app';
import scrollPersistTaps from '../../../utils/scrollPersistTaps';

const theme = 'light';
const { width, height } = Dimensions.get('window');

const BasicInfoModal = ({isVisible, onBackdropPress, onUpdate}) => {

  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');
  const [topScrollEnable, setTopScrollEnable] = useState(false);
  const [country, setCountry] = useState('');

  const nameRef = useRef(null);
  const phoneRef = useRef(null);

  const onSubmit = () => {
    if (!name.length) {
      nameRef.current.focus();
      return
    }
    
    if (!phone.length) {
      phoneRef.current.focus();
      return
    }

    if (!gender || !country || !birthday) return; 

    onUpdate(name, gender, country, phone, birthday);
  };

  return (
    <Modal 
      isVisible={isVisible} 
      animationInTiming={400}                
      onBackButtonPress={onBackdropPress}
      onBackdropPress={onBackdropPress}
      style={styles.modal_container}
      deviceWidth={width}
      deviceHeight={height}
      propagateSwipe={true}
      backdropOpacity={0.7}>

      <View style={styles.container}>
        <KeyboardView 
          {...scrollPersistTaps}
          keyboardVerticalOffset={128}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{I18n.t('update_basic_information')}</Text>
          <Text style={styles.descriptionText}>{I18n.t('premium_detail')}</Text>
          <View style={{height: 20}}/>
          <FloatingTextInput
            inputRef={nameRef}
            value={name}
            returnKeyType="next"
            keyboardType="default"
            textContentType="oneTimeCode"
            label={I18n.t('Name')}
            placeholder={I18n.t('enter_name')}
            onChangeText={name => setName(name)}
            theme={theme}
          />
          <ExGender
            containerStyle={styles.selectStyle}
            label={I18n.t('Select_Your_Gender')}
            value={gender}
            topScrollEnable={()=>setTopScrollEnable(topScrollEnable)}
            toggleShow={show => {
              setTopScrollEnable(!show)
            }}
            action={({value}) => {
              if (!value) {
                return;
              }
              setGender(value);
            }}
            theme={theme}
          />
          <CsAutocompleteSelect
            theme={theme}
            data={Countries}
            placeholder={I18n.t('Select_country')}
            label={I18n.t('Country')}
            onSelectItem={(value)=>setCountry(value?.title)}
          />
          <FloatingTextInput
            inputRef={phoneRef}
            value={phone}
            returnKeyType="next"
            keyboardType="phone-pad"
            textContentType="oneTimeCode"
            label={I18n.t('Phone_number')}
            placeholder={'Type phone number'}
            onChangeText={phone => setPhone(phone)}
            theme={theme}
          />
          <ExDatePicker
            theme={theme}
            placeholder={I18n.t('select_birthday')}
            value={birthday}
            topScrollEnable={topScrollEnable}
            toggleShow={show => {
              setTopScrollEnable(!show)
            }}
            action={({value}) => {
              if (!value) {
                return;
              }
              setBirthday(value);
            }}
            label={I18n.t('Birthday')}
          />
          <Button
            style={styles.submitBtn}
            title={I18n.t('update')}
            size="W"
            onPress={onSubmit}
            testID="login-submit"
            theme={theme}
            pressingHighlight
          />

          <View style={{height: 20}}/>
        </KeyboardView>
      </View>
    </Modal>
  );
};

export default BasicInfoModal;
