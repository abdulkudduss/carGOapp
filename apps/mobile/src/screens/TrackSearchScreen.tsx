// TrackSearchScreen — look up a parcel by track number and act on it (TZ §6.4).
// A client whose parcel arrived UNCLAIMED (bought without a pre-alert) finds it
// here and either claims it or contests another client's claim.
//
// The result card is driven ENTIRELY by the server's response — `claimable` and
// `claim_status` are read, never computed on the client (TZ §6.4). The four
// display states:
//   A. claimable=true (UNCLAIMED)        → card + «Это моя посылка» → claim.
//      On 409 ALREADY_CLAIMED (a race) we reveal the already-claimed text plus
//      «Оспорить», routing the user into the dispute flow.
//   B. claimable=false + CLAIMED         → card + «Оспорить» → dispute sheet.
//   C. claimable=false + DISPUTED        → card + «уже оспаривается», no action.
//   D. not found (code PARCEL_NOT_FOUND) → EmptyState.
// We never render «Оспорить» for an UNCLAIMED/own parcel, so the server's 422
// CANNOT_DISPUTE is only a defensive branch, not a normal path.
//
// claim success → toast + navigate to ParcelList + invalidate useParcels (the
// parcel now belongs to the caller, so it appears in the list). The dispute
// sheet is mounted here (not a separate screen); on success it re-runs the
// search so the card flips to state C (DISPUTED) in place.

import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';
import { ClaimBadge } from '../ui/ClaimBadge';
import { BottomSheet } from '../ui/BottomSheet';
import { useToast } from '../ui/Toast';
import { STATUS_LABELS, CLAIM_LABELS, type StatusValue, type ClaimValue } from '../ui/labels';
import { role, space, type, weight } from '../ui/theme';
import { t } from '../i18n';
import { isApiError } from '@cargo/api';
import { errorToMessage } from '../api/errorToMessage';
import {
  useTrackSearch,
  useClaimParcel,
  useDisputeParcel,
  parcelsQueryKey,
  type TrackSearchResult,
} from '../api/hooks';
import type { ClientScreenProps } from '../navigation/types';

const STATUS_KEYS = new Set<string>(Object.keys(STATUS_LABELS));
function asStatus(s: string | undefined): StatusValue | null {
  return s != null && STATUS_KEYS.has(s) ? (s as StatusValue) : null;
}
const CLAIM_KEYS = new Set<string>(Object.keys(CLAIM_LABELS));
function asClaim(s: string | undefined): ClaimValue | null {
  return s != null && CLAIM_KEYS.has(s) ? (s as ClaimValue) : null;
}

function errorCode(e: unknown): string | null {
  return isApiError(e) ? e.code : null;
}

export function TrackSearchScreen() {
  const navigation = useNavigation<ClientScreenProps<'TrackSearch'>['navigation']>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const search = useTrackSearch();
  const claim = useClaimParcel();
  const dispute = useDisputeParcel();

  const [trackNumber, setTrackNumber] = useState('');
  // The track that produced the current result — reused to refresh after a
  // dispute (so the card flips to DISPUTED in place).
  const [searchedTrack, setSearchedTrack] = useState('');
  // Set when a claim races and loses (409 ALREADY_CLAIMED): the claimable card
  // then shows the already-claimed text + «Оспорить» instead of the claim button.
  const [claimConflict, setClaimConflict] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [comment, setComment] = useState('');

  const runSearch = (number: string) => {
    const trimmed = number.trim();
    if (!trimmed) return;
    setSearchedTrack(trimmed);
    setClaimConflict(false); // a fresh result starts without a prior conflict
    search.mutate(trimmed, {
      // PARCEL_NOT_FOUND is a normal answer (state D) → handled in render. Any
      // other failure (network, …) is a real error → toast it; the card stays.
      onError: (e) => {
        if (errorCode(e) !== 'PARCEL_NOT_FOUND') {
          toast({ title: errorToMessage(e), variant: 'danger' });
        }
      },
    });
  };

  const onClaim = (id: number) => {
    claim.mutate(id, {
      onSuccess: () => {
        toast({ title: t('track.claimed_success'), variant: 'success' });
        queryClient.invalidateQueries({ queryKey: parcelsQueryKey });
        navigation.navigate('ParcelList');
      },
      onError: (e) => {
        // Another client claimed it first → offer the dispute path in-place.
        if (errorCode(e) === 'ALREADY_CLAIMED') {
          setClaimConflict(true);
        } else {
          toast({ title: errorToMessage(e), variant: 'danger' });
        }
      },
    });
  };

  const onConfirmDispute = () => {
    const id = search.data?.parcel_id;
    if (id == null) return; // a result is always present when the sheet is open
    dispute.mutate(
      { id, comment: comment.trim() || undefined },
      {
        onSuccess: () => {
          toast({ title: t('track.disputed_success'), variant: 'success' });
          setDisputeOpen(false);
          setComment('');
          runSearch(searchedTrack); // refresh → card flips to DISPUTED (state C)
        },
        onError: (e) => {
          const code = errorCode(e);
          const message =
            code === 'ALREADY_DISPUTED'
              ? t('track.already_disputed')
              : code === 'CANNOT_DISPUTE'
                ? t('track.cannot_dispute')
                : errorToMessage(e);
          toast({ title: message, variant: 'danger' });
          setDisputeOpen(false);
        },
      },
    );
  };

  const result = search.data;
  const notFound = search.isError && errorCode(search.error) === 'PARCEL_NOT_FOUND';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Input
              placeholder={t('track.placeholder')}
              autoCapitalize="characters"
              autoCorrect={false}
              value={trackNumber}
              onChangeText={setTrackNumber}
              onSubmitEditing={() => runSearch(trackNumber)}
              returnKeyType="search"
              editable={!search.isPending}
            />
          </View>
          <Button
            title={t('track.search')}
            onPress={() => runSearch(trackNumber)}
            disabled={search.isPending || trackNumber.trim().length === 0}
          />
        </View>

        {search.isPending ? (
          <Card>
            <View style={styles.cardLines}>
              <Skeleton width="60%" height={20} />
              <Skeleton width="40%" height={16} />
              <Skeleton width="50%" height={16} />
            </View>
          </Card>
        ) : notFound ? (
          <EmptyState title={t('track.not_found')} icon="📦" />
        ) : result ? (
          <ResultCard
            result={result}
            claimConflict={claimConflict}
            claiming={claim.isPending}
            onClaim={onClaim}
            onDispute={() => {
              setComment('');
              setDisputeOpen(true);
            }}
          />
        ) : (
          <EmptyState title={t('track.hint')} icon="🔍" />
        )}
      </ScrollView>

      <BottomSheet
        open={disputeOpen}
        onClose={() => setDisputeOpen(false)}
        title={t('track.dispute_title')}
        footer={
          <>
            <View style={styles.footerBtn}>
              <Button
                title={t('track.dispute_cancel')}
                variant="secondary"
                fullWidth
                onPress={() => setDisputeOpen(false)}
                disabled={dispute.isPending}
              />
            </View>
            <View style={styles.footerBtn}>
              <Button
                title={dispute.isPending ? t('common.loading') : t('track.dispute_confirm')}
                fullWidth
                onPress={onConfirmDispute}
                disabled={dispute.isPending}
              />
            </View>
          </>
        }
      >
        <Input
          label={t('track.dispute_comment')}
          value={comment}
          onChangeText={setComment}
          multiline
          editable={!dispute.isPending}
        />
      </BottomSheet>
    </SafeAreaView>
  );
}

function ResultCard({
  result,
  claimConflict,
  claiming,
  onClaim,
  onDispute,
}: {
  result: TrackSearchResult;
  claimConflict: boolean;
  claiming: boolean;
  onClaim: (id: number) => void;
  onDispute: () => void;
}) {
  const status = asStatus(result.status);
  const claim = asClaim(result.claim_status);

  // State A — claimable → claim it (unless a claim already lost a race, then
  // dispute). State B — someone else's claim → offer to contest it. State C —
  // already disputed → inform, no action.
  const canClaim = result.claimable === true && !claimConflict;
  const canDispute =
    (result.claimable === true && claimConflict) ||
    (result.claimable === false && claim === 'CLAIMED');
  const isDisputed = result.claimable === false && claim === 'DISPUTED';

  return (
    <Card>
      <View style={styles.cardLines}>
        <View style={styles.rowBetween}>
          <Text style={styles.code}>{result.parcel_code}</Text>
          {status && <StatusBadge status={status} />}
        </View>

        {claim && (
          <View style={styles.rowStart}>
            <ClaimBadge claim={claim} />
          </View>
        )}

        {result.location != null && result.location !== '' && (
          <Text style={styles.muted}>
            {t('track.location')}: {result.location}
          </Text>
        )}

        {claimConflict && <Text style={styles.muted}>{t('track.already_claimed')}</Text>}

        {isDisputed && <Text style={styles.muted}>{t('track.disputed_pending')}</Text>}

        {canClaim && (
          <View style={styles.action}>
            <Button
              title={claiming ? t('common.loading') : t('track.claim')}
              fullWidth
              onPress={() => onClaim(result.parcel_id)}
              disabled={claiming}
            />
          </View>
        )}

        {canDispute && (
          <View style={styles.action}>
            <Button title={t('track.dispute')} variant="secondary" fullWidth onPress={onDispute} />
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: role.bg.app },
  content: { padding: space[6], gap: space[4], flexGrow: 1 },
  searchRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space[3] },
  searchInput: { flex: 1 },
  cardLines: { gap: space[3] },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space[3] },
  rowStart: { flexDirection: 'row' },
  action: { marginTop: space[2] },
  footerBtn: { flex: 1 },
  code: {
    fontSize: type.lg.fontSize,
    lineHeight: type.lg.lineHeight,
    fontWeight: weight.semibold,
    color: role.text.primary,
    flexShrink: 1,
  },
  muted: { fontSize: type.sm.fontSize, lineHeight: type.sm.lineHeight, color: role.text.muted },
});
