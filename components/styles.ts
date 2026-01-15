import { StyleSheet, Dimensions } from "react-native";
import Colors from "@/locales/brandColors";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2 - 15;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    paddingBottom: 10,
    backgroundColor: Colors.background,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text.gray,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    margin: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text.gray,
    textAlign: "left",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    marginLeft: 5,
    color: Colors.primary,
    fontWeight: "500",
  },
  listContainer: {
    padding: 5,
    paddingBottom: 120,
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },
  cardContainer: {
    width: CARD_WIDTH,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  cardImageContainer: {
    width: "100%",
    height: 150,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text.gray,
    marginBottom: 8,
    textAlign: "left",
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currency: {
    fontSize: 14,
    color: Colors.accent,
    marginRight: 5,
  },
  price: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.gray,
  },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResults: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text.lightGray,
    textAlign: "center",
  },
});
export default styles