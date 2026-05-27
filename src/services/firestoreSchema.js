export const firestoreSchema = {
  users: {
    "{uid}": {
      profile: "name, phone, village, businessType, preferredLanguage, photoUrl, appMode",
      settings: "pinEnabled, darkMode, notificationChannels, trustedFamilyAccess",
      borrowers: {
        "{borrowerId}": "personalInfo, nomineeName, nomineePhone, guarantorName, guarantorPhone, familyContactPhone, trustScore, riskLevel, notes, createdAt, updatedAt"
      },
      loans: {
        "{loanId}": "borrowerId, principal, interestRate, interestType, cycle, repaymentType, securityType, dueDate, balance, status"
      },
      payments: {
        "{paymentId}": "loanId, borrowerId, amount, paymentDate, method, paymentType, receiptNumber"
      },
      reminders: {
        "{reminderId}": "loanId, borrowerId, dueDate, channel, status, sentAt"
      },
      extensions: {
        "{extensionId}": "loanId, borrowerId, oldDueDate, newDueDate, reason, interestHandling, decision"
      },
      guarantors: {
        "{guarantorId}": "borrowerId, loanId, name, mobile, address, relationship, photoUrl, signatureUrl"
      },
      collateral: {
        "{collateralId}": "borrowerId, loanId, type, description, estimatedValue, photoUrls, returned, returnDate"
      },
      evidence: {
        "{evidenceId}": "borrowerId, loanId, category, fileUrl, fileType, uploadedAt, notes"
      },
      aadhaarVerifications: {
        "{verificationId}": "borrowerId, borrowerConsent, maskedAadhaar, aadhaarLast4, nameAsPerAadhaar, birthYear, method, status, providerReference, verifiedAt"
      }
    }
  }
};
