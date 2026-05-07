package com.sy.utils;

import com.aliyun.oss.ClientException;
import com.aliyun.oss.model.CannedAccessControlList;
import com.aliyun.oss.model.PutObjectRequest;
import com.aliyun.oss.OSS;
import com.aliyun.oss.OSSClientBuilder;
import com.aliyun.oss.OSSException;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayInputStream;

@Data
@AllArgsConstructor
@Slf4j
public class AliOssUtil {

    private String endpoint;
    private String accessKeyId;
    private String accessKeySecret;
    private String bucketName;

    /**
     * update files
     *
     * @param bytes
     * @param objectName
     * @return
     */
    public String upload(byte[] bytes, String objectName) {

        OSS ossClient = new OSSClientBuilder().build(endpoint, accessKeyId, accessKeySecret);

        try {
            // Upload with public-read ACL in the same request.
            // Some bucket configs may ignore a subsequent setObjectAcl call.
            PutObjectRequest putRequest =
                    new PutObjectRequest(bucketName, objectName, new ByteArrayInputStream(bytes));
//            putRequest.setCannedACL(CannedAccessControlList.PublicRead);
            ossClient.putObject(putRequest);
        } catch (OSSException oe) {
            System.out.println("Caught an OSSException, which means your request made it to OSS, "
                    + "but was rejected with an error response for some reason.");
            System.out.println("Error Message:" + oe.getErrorMessage());
            System.out.println("Error Code:" + oe.getErrorCode());
            System.out.println("Request ID:" + oe.getRequestId());
            System.out.println("Host ID:" + oe.getHostId());
        } catch (ClientException ce) {
            System.out.println("Caught an ClientException, which means the client encountered "
                    + "a serious internal problem while trying to communicate with OSS, "
                    + "such as not being able to access the network.");
            System.out.println("Error Message:" + ce.getMessage());
        } finally {
            if (ossClient != null) {
                ossClient.shutdown();
            }
        }

        // Access path rules: https://BucketName.Endpoint/ObjectName
        String endpointHost = endpoint
                .replaceFirst("^https?://", "")
                .replaceAll("/+$", "");
        // endpoint may already contain "<bucket>." prefix, avoid generating duplicated host
        String bucketPrefix = bucketName + ".";
        if (endpointHost.startsWith(bucketPrefix)) {
            endpointHost = endpointHost.substring(bucketPrefix.length());
        }
        StringBuilder stringBuilder = new StringBuilder("https://");
        stringBuilder
                .append(bucketName)
                .append(".")
                .append(endpointHost)
                .append("/")
                .append(objectName);

        log.info("Upload file to:{}", stringBuilder.toString());

        return stringBuilder.toString();
    }
}
