import ScreenWrapper from "@/components/ScreenWrapper";
import StyledText from "@/components/StyledText";
import { PRIMARY, WHITE } from "@/constants/Colors";
import useRewards from "@/hooks/useRewards";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";

export default function Awards() {
  const { rewards, getRewards, redeemReward, loading, error } = useRewards();

  const handleRedeem = (id: number) => async () => {
    await redeemReward(id);
    await getRewards();
  };

  if (error) {
    return (
      <ScreenWrapper title="Rewards">
        <StyledText>{error}</StyledText>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper title="Rewards">
      <FlatList
        data={rewards}
        style={styles.rewardList}
        refreshing={loading}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.reward}>
            <StyledText
              style={[
                styles.rewardTitle,
                item.redeemedAt ? styles.redeemedTitle : {},
              ]}
            >
              {item.reward}
            </StyledText>
            {!item.redeemedAt ? (
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={handleRedeem(item.id)}
              >
                <StyledText style={styles.redeemButtonText}>Claim</StyledText>
              </TouchableOpacity>
            ) : (
              <StyledText style={styles.rewardTitle}>
                {item.redeemedAt?.toLocaleDateString()}
              </StyledText>
            )}
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  rewardList: {
    flex: 1,
    width: "100%",
    marginTop: 30,
  },
  reward: {
    width: "100%",
    flexDirection: "row",
    paddingBottom: 14,
    justifyContent: "space-between",
    alignItems: "center",
  },
  rewardTitle: {
    fontSize: 24,
  },
  redeemedTitle: {
    textDecorationLine: "line-through",
  },
  redeemButton: {
    backgroundColor: PRIMARY,
    padding: 12,
  },
  redeemButtonText: {
    color: WHITE,
    fontSize: 18,
  },
});
