
import { StyleSheet } from "react-native";
import { Dimensions } from "react-native";
const { width: screenWidth } = Dimensions.get("window");


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  animatedHeaderBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  masonryListContentContainer: {
    paddingBottom: 20,
    justifyContent: "center",
  },
  masonryListWrapper: {
    flex: 1,
  },
  bottomSheetContent: {
    flex: 1,
    backgroundColor: "#E9E9E9FF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetScrollContentContainer: {
    marginBottom: 20,
  },
  imageSliderContainerDetails: {
    width: "100%",
    marginBottom: 10,
    overflow:'scroll'
  },
  imageScrollViewDetails: {
    width: "100%",
    height: 'auto',
  },
  imageScrollContentDetails: {
    alignItems: "center",
  },
  productImageDetails: {
    width: screenWidth - 40,
    marginHorizontal: 20,
    borderRadius: 15,
    backgroundColor: "#F0F0F0FF",
  },
  bottomSheetScrollView: {
    zIndex: 10,
    flex: 1,
  },
  detailsContainerDetails: {
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 15,
  },
  addToCartButtonDetails: {
    backgroundColor: "#f0b745",
    borderRadius: 30,
    width: "100%",
    alignSelf: "center",
    paddingVertical: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  addToCartContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  sliderContainer: {
    marginBottom: 16,
    overflow: "hidden",
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoriesScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryItem: {
    alignItems: "center",
    marginRight: 16,
    width: 80,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f0b745",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    elevation: 2,
    shadowColor: "#f0b745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    color: "#4A5568",
    fontWeight: "500",
    textAlign: "center",
  },
  sectionHeaderContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    marginHorizontal: 8,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2D3748",
    textAlign: "right",
  },
  viewAllText: {
    fontSize: 14,
    color: "#f0b745",
    fontWeight: "600",
  },
  itemPressable: {
    flex: 1,
    margin: 4,
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  noMoreProductsText: {
    color: "#718096",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingMoreText: {
    color: "#f0b745",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 8,
  },
  bottomSheetBackground: {
    backgroundColor: "#EDEDEDFF",
    borderRadius: 20,
  },
  bottomSheetHandleIndicator: {
    backgroundColor: "#ccc",
  },
  loadingContainerBottomSheet: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTextBottomSheet: {
    fontSize: 18,
    color: "#f0b745",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    minHeight: 200,
  },
  emptyText: {
    color: "#718096",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
    textAlign: "center",
  },
  clearSearchButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 5,
  },
  clearSearchText: {
    color: "#4A5568",
    fontWeight: "bold",
  },
  productNameDetails: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "right",
    color: "#2D3748",
    marginBottom: 5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
  },
  productPriceDetails: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#38A169",
    textAlign: "right",
  },
  productPriceDetailsDiscounted: {
    fontSize: 18,
    color: "#A0AEC0",
    textDecorationLine: "line-through",
    textAlign: "right",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2D3748",
    textAlign: "right",
    marginBottom: 8,
    marginTop: 10,
  },
  quantityContainerDetails: {
    alignItems: "flex-end",
  },
  quantityControlDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: "#F7FAFC",
    borderRadius: 25,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  quantityTextDetails: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2D3748",
  },
  sizeSelectionContainerDetails: {
    alignItems: "flex-end",
  },
  sizeOptionsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
  },
  sizeOptionDetails: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#f0b745",
    backgroundColor: "#F7FAFC",
  },
  sizeTextDetails: {
    color: "#4A5568",
    fontSize: 16,
    fontWeight: "500",
  },
  selectedSizeDetails: {
    borderColor: "#f0b745",
    backgroundColor: "#f0b745",
  },
  selectedSizeTextDetails: {
    color: "#FFFFFF",
  },
  descriptionContainerDetails: {
    alignSelf: "flex-end",
    marginTop: 8,
  },
  descriptionLabelDetails: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2D3748",
    textAlign: "right",
  },
  descriptionTextDetails: {
    fontSize: 14,
    color: "#4A5568",
    textAlign: "right",
    lineHeight: 22,
  },
  addToCartTextDetails: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  initialLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#f0b745",
  },
});
export default styles;