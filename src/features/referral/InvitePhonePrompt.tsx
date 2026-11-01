import PhoneVerifyCard from './PhoneVerifyCard';
import { useAccountFlags } from './referralApi';

/**
 * Home prompt for invited players with no verified phone — their inviter is only paid after
 * they verify. The invite pitch itself lives in the home carousel.
 */
export default function InvitePhonePrompt() {
  const { data: flags } = useAccountFlags();
  if (!flags?.referred || flags.phoneVerified) return null;
  return (
    <PhoneVerifyCard
      title="ስልክ ቁጥርዎን ያረጋግጡ"
      sub="ለጓደኛዎ ሽልማት እና ለመለያዎ ደህንነት · Verify your phone to activate your invite."
    />
  );
}
