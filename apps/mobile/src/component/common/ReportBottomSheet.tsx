import type { ReportReason } from '@patty/contracts';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { ListItem } from 'src/component/common/ListItem';
import { ModalContainer } from 'src/component/common/ModalContainer';
import { useCreateReport } from 'src/hooks/api/useReportApi';
import { useToast } from 'src/hooks/ui/useToast';
import { useUIStore } from 'src/store/useUIStore';

export function ReportBottomSheet() {
  const { t } = useTranslation();
  const isOpen = useUIStore((s) => s.reportOpen);
  const target = useUIStore((s) => s.reportTarget);
  const closeReport = useUIStore((s) => s.closeReport);
  const { mutate: createReport } = useCreateReport();
  const toast = useToast();

  const reasons: ReportReason[] = [
    'spam',
    'inappropriate',
    'harassment',
    'fraud',
    'other',
  ];

  const handleSelectReason = (reason: ReportReason) => {
    if (!target) return;

    createReport(
      {
        target_type: target.type,
        target_account_id: target.accountId,
        target_pet_id: target.petId,
        target_message_id: target.messageId,
        reason,
      },
      {
        onSuccess: () => {
          toast.success(t('profile.report_success'));
          closeReport();
        },
        onError: () => {
          toast.error(t('error.generic.internal_error'));
        },
      },
    );
  };

  return (
    <ModalContainer
      visible={isOpen}
      onRequestClose={closeReport}
      title={t('profile.report')}
    >
      <View>
        <ScrollView contentContainerStyle={layoutStyles.scrollContent}>
          {reasons.map((reason) => (
            <ListItem
              key={reason}
              title={t(`profile.report_reason_${reason}` as const)}
              onPress={() => handleSelectReason(reason)}
            />
          ))}
        </ScrollView>
      </View>
    </ModalContainer>
  );
}

const layoutStyles = {
  scrollContent: {
    paddingBottom: 32,
  },
};
